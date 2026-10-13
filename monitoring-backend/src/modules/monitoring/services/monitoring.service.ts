import { HttpService } from '@nestjs/axios';
import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { AiIntegrationService } from '@/modules/ai-integration/services/ai-integration.service';
import { IncidentsService } from '@/modules/incidents/services/incidents.service';
import { DetectionService } from '@/modules/detection/services/detection.service';
import { MonitoredServicesService } from '@/modules/monitored-services/services/monitored-services.service';
import { MetricWindowService } from '@/modules/monitoring/services/metric-window.service';
import { PrometheusMetricsService } from '@/modules/monitoring/services/prometheus-metrics.service';
import { ServiceStateService } from '@/modules/service-state/services/service-state.service';
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
      const checked = await Promise.all(
        this.services.findAll().map((service) => this.check(service.id)),
      );
      return checked.filter((snapshot): snapshot is ServiceSnapshot => snapshot !== undefined);
    } finally {
      this.running = false;
    }
  }

  check(id: string): Promise<ServiceSnapshot | undefined> {
    const current = this.checksInFlight.get(id);
    if (current) return current;

    const pending = this.performCheck(id).finally(() => this.checksInFlight.delete(id));
    this.checksInFlight.set(id, pending);
    return pending;
  }

  private async performCheck(id: string): Promise<ServiceSnapshot | undefined> {
    const service = this.services.find(id);
    if (!service) return;
    const started = Date.now();
    let reachable = false;
    let timedOut = false;
    let message = 'Healthy';
    try {
      await firstValueFrom(
        this.http.get(`${this.baseUrl}${service.path}`, { timeout: this.timeout }),
      );
      reachable = true;
    } catch (error) {
      message = error instanceof Error ? error.message : 'Health check failed';
      timedOut = error instanceof Error && /timeout|ECONNABORTED|ETIMEDOUT/i.test(error.message);
    }
    const latency = Date.now() - started;
    const failures = reachable ? 0 : service.consecutiveFailures + 1;
    const window = this.windows.record(id, {
      at: Date.now(),
      latencyMs: latency,
      reachable,
      timedOut,
    });
    if (window.sampleCount >= 3) {
      const traffic = await this.traffic.read(id);
      if (traffic) {
        window.requestRate = traffic.requestRate;
        window.errorRate = Math.max(window.errorRate, traffic.errorRate);
        window.latencyP95Ms = Math.max(window.latencyP95Ms, traffic.latencyP95Ms);
      }
    }
    let aiAnomalyScore = 0;
    if (window.sampleCount >= 3) {
      try {
        const analysis = await this.ai.analyzeWindow(window);
        if (analysis.status === 'OK') aiAnomalyScore = analysis.anomalyScore;
      } catch (error) {
        this.logger.warn(
          `AI analysis unavailable for ${id}: ${error instanceof Error ? error.message : 'unknown error'}`,
        );
      }
    }
    const detection = this.detection.analyze({
      latency: window.latencyP95Ms,
      errorRate: window.errorRate,
      timeoutRate: window.timeoutRate,
      availability: window.availability,
      requestRate: window.requestRate,
      healthCheckFailures: failures,
      aiAnomalyScore,
    });
    const status = this.states.decide(service.status, detection, reachable);
    this.services.update(id, {
      status,
      lastCheckedAt: new Date().toISOString(),
      latencyMs: latency,
      consecutiveFailures: failures,
      message,
    });
    try {
      await this.incidents.sync(id, status, {
        reasons: detection.reasons,
        anomalyScore: aiAnomalyScore,
        observedAt: new Date().toISOString(),
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
}
