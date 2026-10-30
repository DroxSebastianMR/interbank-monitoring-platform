import { HttpService } from '@nestjs/axios';
import { isAxiosError } from 'axios';
import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { AiIntegrationService } from '@/modules/ai-integration/services/ai-integration.service';
import { IncidentsService } from '@/modules/incidents/services/incidents.service';
import { DetectionService } from '@/modules/detection/services/detection.service';
import { MonitoredServicesService } from '@/modules/monitored-services/services/monitored-services.service';
import { MetricWindowService } from '@/modules/monitoring/services/metric-window.service';
import { PrometheusMetricsService } from '@/modules/monitoring/services/prometheus-metrics.service';
import { ServiceStateService } from '@/modules/service-state/services/service-state.service';
import { observationFreshness } from '@/modules/service-state/utils/observation-freshness';
import type {
  OperationalEvaluation,
  RuleProfile,
} from '@/modules/monitoring/interfaces/operational-evaluation';
import type { ServiceSnapshot } from '@/modules/service-state/interfaces/service-state';
@Injectable()
export class MonitoringService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MonitoringService.name);
  private timer?: NodeJS.Timeout;
  private running = false;
  private readonly checksInFlight = new Map<string, Promise<ServiceSnapshot | undefined>>();
  private readonly baseUrl: string;
  private readonly timeout: number;
  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
    private readonly services: MonitoredServicesService,
    private readonly detection: DetectionService,
    private readonly states: ServiceStateService,
    private readonly windows: MetricWindowService,
    private readonly traffic: PrometheusMetricsService,
    private readonly ai: AiIntegrationService,
    private readonly incidents: IncidentsService,
  ) {
    this.baseUrl = config.get<string>('integrations.appBackendUrl', 'http://localhost:8080');
    this.timeout = config.get<number>('monitoring.timeoutMs', 3000);
  }
  onModuleInit() {
    if (this.config.get<boolean>('app.docsOnly', false)) return;
    void this.runAll();
    this.timer = setInterval(
      () => void this.runAll(),
      this.config.get<number>('monitoring.intervalMs', 10000),
    );
  }
  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }
  async runAll(): Promise<ServiceSnapshot[]> {
    if (this.running) return this.services.findAll();
    this.running = true;
    try {
      const snapshots: ServiceSnapshot[] = [];
      const enabledServices = this.services
        .findAll()
        .filter((service) => service.monitoringEnabled !== false);

      // Keep scheduled checks sequential. Each check persists several records and the
      // development database has a deliberately small connection pool; starting every
      // service at once can starve authentication and other user-facing requests.
      for (const service of enabledServices) {
        try {
          const snapshot = await this.check(service.id, 'SCHEDULED');
          if (snapshot) snapshots.push(snapshot);
        } catch (error) {
          this.logger.error(`Monitoring check failed: ${String(error)}`);
        }
      }

      return snapshots;
    } finally {
      this.running = false;
    }
  }

  check(
    id: string,
    origin: 'SCHEDULED' | 'MANUAL' = 'MANUAL',
  ): Promise<ServiceSnapshot | undefined> {
    const service = this.services.find(id);
    if (!service) throw new NotFoundException('Servicio monitoreado no encontrado');
    if (service.monitoringEnabled === false)
      throw new ConflictException('La supervisión está pausada');
    const current = this.checksInFlight.get(id);
    if (current) return current;

    const pending = this.performCheck(id, origin).finally(() => this.checksInFlight.delete(id));
    this.checksInFlight.set(id, pending);
    return pending;
  }

  private async performCheck(
    id: string,
    origin: 'SCHEDULED' | 'MANUAL',
  ): Promise<ServiceSnapshot | undefined> {
    const service = this.services.find(id);
    if (!service || service.monitoringEnabled === false) return;
    const previousStatus = service.status;
    const started = Date.now();
    let reachable = false;
    let timedOut = false;
    let message = 'Comprobación funcional correcta';
    try {
      const response = await firstValueFrom(
        this.http.get<unknown>(`${this.baseUrl}${service.path}`, {
          timeout: this.timeout,
          maxRedirects: 0,
        }),
      );
      reachable = this.isValidHealthResponse(response.data, service.path);
      if (!reachable) message = 'Respuesta de sonda sin un resultado funcional válido';
    } catch (error) {
      // Local/configuration failures must age the observation, not count as bank failures.
      const networkCodes = [
        'ECONNABORTED', 'ETIMEDOUT', 'ECONNREFUSED', 'ECONNRESET',
        'ENOTFOUND', 'EAI_AGAIN', 'ERR_NETWORK',
      ];
      const targetFailure = isAxiosError(error) &&
        (error.response !== undefined || networkCodes.includes(error.code ?? ''));
      const timeout = error instanceof Error && /timeout|ECONNABORTED|ETIMEDOUT/i.test(error.message);
      if (!targetFailure && !timeout) throw error;
      message = 'Fallo de respuesta o conexión de la sonda';
      timedOut = timeout;
    }
    const latency = Date.now() - started;
    const observedAt = new Date().toISOString();
    const profile = this.ruleProfile();
    const previous = service.evaluation;
    const continuous = previous != null &&
      observationFreshness(service, profile.observationMaxAgeMs, Date.parse(observedAt)) === 'CURRENT' &&
      previous.profile.version === profile.version &&
      previous.serviceVersion === (service.version ?? 1) &&
      Object.entries(profile).every(([key, value]) => previous.profile[key as keyof RuleProfile] === value);
    // A pause, gap or changed rule starts a new confirmation sequence.
    const failures = reachable ? 0 : (continuous ? service.consecutiveFailures : 0) + 1;
    if (!continuous) this.windows.clear(id);
    const window = this.windows.record(id, {
      at: Date.parse(observedAt), latencyMs: latency, reachable, timedOut,
    });
    // Never overwrite probe values with metrics of another source or window.
    const traffic = await this.traffic.read(id);
    const httpObservedAt = new Date().toISOString();
    let aiAnomalyScore = 0;
    let riskLevel: ServiceSnapshot['riskLevel'] = null;
    let riskStatus: OperationalEvaluation['risk']['status'] = 'INSUFFICIENT_DATA';
    if (window.sampleCount >= 3 && traffic !== null) {
      riskStatus = 'UNAVAILABLE';
      try {
        // Explicit feature composition for AI only; never mutate the probe window.
        const analysis = await this.ai.analyzeWindow({ ...window, requestRate: traffic.requestRate });
        if (analysis.status === 'INSUFFICIENT_DATA') riskStatus = 'INSUFFICIENT_DATA';
        if (analysis.serviceId === id && analysis.status === 'OK' &&
          Number.isFinite(analysis.anomalyScore) && analysis.anomalyScore >= 0 && analysis.anomalyScore <= 1 &&
          ['LOW', 'MEDIUM', 'HIGH'].includes(analysis.riskLevel)) {
          aiAnomalyScore = analysis.anomalyScore;
          riskLevel = analysis.riskLevel;
          riskStatus = 'AVAILABLE';
        }
      } catch {
        this.logger.warn(`AI analysis unavailable for ${id}; technical rules remain active`);
      }
    }
    const detection = this.detection.analyze({
      latency,
      errorRate: window.errorRate,
      timeoutRate: window.timeoutRate,
      availability: window.availability,
      requestRate: window.requestRate,
      healthCheckFailures: failures,
      aiAnomalyScore,
      http: traffic,
    });
    const requiresHttpRecovery = previous?.requiresHttpRecovery === true ||
      detection.reasons.some((reason) => reason.startsWith('HTTP '));
    const technicalDataAvailable = !reachable || !requiresHttpRecovery ||
      (traffic !== null && traffic.errorRate !== null && traffic.latencyP95Ms !== null);
    const healthy = reachable && detection.severity === 'NONE' && technicalDataAvailable;
    const successes = healthy ? (continuous ? service.consecutiveSuccesses ?? 0 : 0) + 1 : 0;
    const consecutiveDegradations = healthy || !technicalDataAvailable
      ? 0 : (continuous ? previous?.consecutiveDegradations ?? 0 : 0) + 1;
    const firstSignalAt = healthy || !technicalDataAvailable
      ? null : (continuous ? previous?.firstSignalAt : null) ?? observedAt;
    const degradationConfirmed =
      consecutiveDegradations >= profile.degradationSamples && firstSignalAt !== null &&
      Date.parse(observedAt) - Date.parse(firstSignalAt) >= profile.degradationDurationMs;
    const status = !technicalDataAvailable ? service.status : this.states.decide(
      service.status, detection, reachable, successes,
      service.lastCheckedAt !== null, degradationConfirmed, profile.recoverySamples,
      previous?.lastConfirmedStatus as ServiceStatus | null | undefined,
    );
    const pendingConfirmation = !technicalDataAvailable ||
      (!healthy && !degradationConfirmed && detection.severity !== 'HIGH');
    const confirmedAt = !pendingConfirmation && status !== 'RECOVERING'
      ? (status === service.status && continuous ? previous?.confirmedAt : null) ?? observedAt
      : previous?.confirmedAt ?? null;
    const evaluation: OperationalEvaluation = {
      schemaVersion: 1, serviceVersion: service.version ?? 1, observedAt, profile,
      probe: {
        source: 'health-probe', reachable, timedOut, latencyMs: latency,
        sampleCount: window.sampleCount, windowStart: window.windowStart, windowEnd: window.windowEnd,
        latencyP95Ms: window.latencyP95Ms, failureRate: window.errorRate, timeoutRate: window.timeoutRate,
      },
      http: traffic ? { source: 'prometheus-http', queriedAt: httpObservedAt, windowSeconds: 60, ...traffic } : null,
      risk: {
        source: 'probe-window-with-http-rate', httpRequestRateHz: traffic?.requestRate ?? null,
        status: riskStatus, score: riskLevel ? aiAnomalyScore : null, level: riskLevel,
      },
      reasons: detection.reasons, consecutiveDegradations, firstSignalAt, confirmedAt, pendingConfirmation, healthy,
      lastConfirmedStatus: !pendingConfirmation && status !== 'RECOVERING'
        ? status : previous?.lastConfirmedStatus ?? null,
      technicalDataAvailable,
      requiresHttpRecovery: status === 'OPERATIONAL' && healthy ? false : requiresHttpRecovery,
    };
    if (!technicalDataAvailable) message = 'Sin métricas HTTP suficientes para confirmar recuperación';
    else if (pendingConfirmation) message = 'Señal técnica pendiente de confirmación';
    else if (detection.reasons.length) message = detection.reasons.join('; ');
    const observation: ServiceSnapshot = {
      ...service,
      status,
      lastCheckedAt: observedAt,
      latencyMs: latency,
      consecutiveFailures: failures,
      consecutiveSuccesses: successes,
      message,
      anomalyScore: riskLevel ? aiAnomalyScore : null,
      riskLevel,
      evaluation,
    };
    const latest = this.services.find(id);
    if (!latest || latest.monitoringEnabled === false || latest.version !== service.version) {
      return latest;
    }
    try {
      await this.services.recordObservation(id, previousStatus, reachable, timedOut, origin, observation);
    } catch (error) {
      this.windows.clear(id);
      throw error;
    }
    // Publish the in-memory state only after its durable observation has committed.
    this.services.update(id, observation);
    try {
      // A slow collector or persistence failure must not emit a stale transition.
      if (pendingConfirmation ||
        observationFreshness({ lastCheckedAt: observedAt }, profile.observationMaxAgeMs) !== 'CURRENT') {
        return this.services.find(id);
      }
      await this.incidents.sync(id, status, {
        reasons: detection.reasons,
        anomalyScore: aiAnomalyScore,
        observedAt,
        evaluation,
      });
    } catch (error) {
      this.logger.error(
        `Incident synchronization failed for ${id}: ${error instanceof Error ? error.message : 'unknown error'}`,
      );
    }
    this.logger.log(
      `Health check completed: service=${id}, status=${status}, latency=${latency}ms`,
    );
    return this.services.find(id);
  }

  private ruleProfile(): RuleProfile {
    return {
      version: this.config.get<string>('rules.version', 'operational-v1'),
      latencyThresholdMs: this.config.get<number>('rules.latencyThresholdMs', 1000),
      maxHealthFailures: this.config.get<number>('rules.maxHealthFailures', 3),
      degradationSamples: this.config.get<number>('rules.degradationSamples', 3),
      degradationDurationMs: this.config.get<number>('rules.degradationDurationMs', 20000),
      recoverySamples: this.config.get<number>('rules.recoverySamples', 3),
      observationMaxAgeMs: this.config.get<number>('rules.observationMaxAgeMs', 30000),
      httpErrorRateThreshold: this.config.get<number>('rules.httpErrorRateThreshold', 0.1),
    };
  }

  private isValidHealthResponse(data: unknown, path: string): boolean {
    if (!data || typeof data !== 'object') return false;
    const value = data as { status?: unknown; service?: unknown };
    const expected = path.split('/')[1];
    return value.status === 'ok' && value.service === expected;
  }
}
