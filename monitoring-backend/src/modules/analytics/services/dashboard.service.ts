import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { DashboardRepository } from '@/modules/analytics/repositories/dashboard.repository';
import { MonitoredServicesService } from '@/modules/monitored-services/services/monitored-services.service';
import { ServiceStatus } from '@/modules/service-state/interfaces/service-state';
import { observedService } from '@/modules/service-state/utils/observed-service';
import type { DashboardMetricsQueryDto } from '@/modules/analytics/dto/dashboard-query.dto';
import { PrometheusMetricsService } from '@/modules/monitoring/services/prometheus-metrics.service';

const STALE_AFTER_MS = 30_000;
const TOPOLOGY_REFRESH_INTERVAL_MS = 10_000;
const TOPOLOGY_INSTANCE_IDS = ['app-backend-1', 'app-backend-2'] as const;

@Injectable()
export class DashboardService {
  constructor(
    private readonly repository: DashboardRepository,
    private readonly services: MonitoredServicesService,
    private readonly config: ConfigService,
    private readonly prometheus: PrometheusMetricsService,
  ) {}

  async overview() {
    const generatedAt = new Date();
    const services = this.services.findAll();
    const { checks, incidents, alerts, activeIncidentsCount, activeAlertsCount } =
      await this.repository.snapshot(new Date(generatedAt.getTime() - 60 * 60_000));
    const summaries = services.map((service) => {
      const observed = observedService(
        service,
        this.config.get<number>('rules.observationMaxAgeMs', STALE_AFTER_MS),
        generatedAt.getTime(),
      );
      return {
        id: service.id,
        name: service.name,
        status: observed.status,
        lastKnownStatus: observed.lastKnownStatus,
        dataFreshness: observed.dataFreshness,
        pendingConfirmation: observed.pendingConfirmation,
        lastCheckedAt: service.lastCheckedAt,
        latencyMs: service.lastCheckedAt ? service.latencyMs : null,
        monitoringEnabled: service.monitoringEnabled !== false,
        evaluation: service.evaluation ?? null,
      };
    });
    const count = (status: ServiceStatus | 'NO_DATA') =>
      summaries.filter((service) => service.status === status).length;
    const lastObservationAt =
      services
        .map((service) => service.lastCheckedAt)
        .filter((value): value is string => value !== null)
        .sort()
        .at(-1) ?? null;
    const latencies = checks.map((check) => check.latencyMs).sort((a, b) => a - b);
    const observed = checks.length;
    const operationalCount = count(ServiceStatus.OPERATIONAL);
    const degradedCount = count(ServiceStatus.DEGRADED) + count(ServiceStatus.RECOVERING);
    const unavailableCount = count(ServiceStatus.UNAVAILABLE);
    const noDataCount = count('NO_DATA');
    return {
      generatedAt: generatedAt.toISOString(),
      environment: this.config.get<string>('app.env', 'development'),
      overallStatus:
        unavailableCount > 0
          ? 'UNAVAILABLE'
          : degradedCount > 0
            ? 'DEGRADED'
            : noDataCount > 0 || services.length === 0
              ? 'NO_DATA'
              : 'OPERATIONAL',
      monitoredServicesCount: services.length,
      operationalCount,
      degradedCount,
      unavailableCount,
      noDataCount,
      activeIncidentsCount,
      activeAlertsCount,
      availability: observed ? checks.filter((check) => check.reachable).length / observed : null,
      latencyP95Ms: observed ? latencies[Math.ceil(observed * 0.95) - 1] : null,
      errorRate: null,
      lastMonitoringCycleAt: lastObservationAt,
      lastObservationAt,
      dataFreshness: lastObservationAt
        ? summaries.every((service) => service.dataFreshness === 'CURRENT')
          ? 'CURRENT'
          : 'STALE'
        : 'NO_DATA',
      services: summaries,
      recentIncidents: incidents.slice(0, 5),
      recentAlerts: alerts.slice(0, 5),
      sources: {
        healthChecks: observed ? 'AVAILABLE' : 'NO_DATA',
        incidents: 'AVAILABLE',
        alerts: 'AVAILABLE',
        httpErrorRate: 'NOT_INSTRUMENTED',
      },
    };
  }

  async metrics(query: DashboardMetricsQueryDto) {
    const to = query.to ? new Date(query.to) : new Date();
    const from = query.from ? new Date(query.from) : new Date(to.getTime() - 60 * 60_000);
    if (from >= to || to.getTime() - from.getTime() > 24 * 60 * 60_000) {
      throw new BadRequestException('El rango de métricas debe ser positivo y no superar 24 horas');
    }
    const checks = (await this.repository.checks(from, to, query.serviceId)).reverse();
    return {
      from: from.toISOString(),
      to: to.toISOString(),
      source: 'persisted-health-checks',
      metric: query.metric ?? 'latency',
      unit:
        query.metric === 'availability' ? 'ratio' : query.metric === 'timeouts' ? 'boolean' : 'ms',
      points: checks.map((check) => ({
        serviceId: check.service.code,
        timestamp: check.checkedAt.toISOString(),
        value:
          query.metric === 'availability'
            ? Number(check.reachable)
            : query.metric === 'timeouts'
              ? Number(check.timedOut)
              : check.latencyMs,
      })),
      truncated: checks.length === 5000,
    };
  }

  async activity(limit: number) {
    const { incidents, alerts } = await this.repository.activity(limit);
    return [
      ...incidents.map((incident) => ({
        id: incident.id,
        type: 'INCIDENT',
        serviceId: incident.serviceKey,
        timestamp: incident.openedAt.toISOString(),
        severity: incident.severity,
        description: incident.title,
      })),
      ...alerts.map((alert) => ({
        id: alert.id,
        type: 'ALERT',
        serviceId: alert.incident.serviceKey,
        timestamp: alert.createdAt.toISOString(),
        severity: null,
        description: alert.message,
      })),
    ]
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
      .slice(0, limit);
  }

  async topology() {
    const now = Date.now();
    const telemetry = await this.prometheus.readInfrastructure([...TOPOLOGY_INSTANCE_IDS]);
    const latencyThresholdMs = this.config.get<number>('rules.latencyThresholdMs', 1_000);
    const statusForInstance = (id: string) => {
      const sample = telemetry.instances.find((item) => item.id === id);
      if (!sample || now - new Date(sample.observedAt).getTime() > STALE_AFTER_MS) return 'NO_DATA';
      if (!sample.reachable) return 'UNAVAILABLE';
      if (
        (sample.latencyP95Ms !== null && sample.latencyP95Ms > latencyThresholdMs) ||
        (sample.errorRate !== null && sample.errorRate >= 0.05)
      )
        return 'DEGRADED';
      return 'OPERATIONAL';
    };
    const instanceNodes = TOPOLOGY_INSTANCE_IDS.map((id) => {
      const sample = telemetry.instances.find((item) => item.id === id);
      return {
        id,
        kind: 'instance',
        status: statusForInstance(id),
        telemetrySource: sample ? 'prometheus' : 'none',
        observedAt: sample?.observedAt ?? null,
        sampleAgeMs: sample ? Math.max(0, now - new Date(sample.observedAt).getTime()) : null,
        latencyMs: null,
        latencyP95Ms: sample?.latencyP95Ms ?? null,
        requestRateHz: sample?.requestRateHz ?? null,
        errorRate: sample?.errorRate ?? null,
      };
    });
    const observations = [
      telemetry.gateway.observedAt,
      ...telemetry.instances.map((item) => item.observedAt),
    ].sort();
    return {
      source: 'active-probe-and-prometheus',
      observedAt: observations.at(-1) ?? null,
      sampling: {
        recommendedIntervalMs: TOPOLOGY_REFRESH_INTERVAL_MS,
        frequencyHz: 1_000 / TOPOLOGY_REFRESH_INTERVAL_MS,
      },
      nodes: [
        {
          id: 'nginx',
          kind: 'gateway',
          status: telemetry.gateway.reachable ? 'OPERATIONAL' : 'UNAVAILABLE',
          telemetrySource: 'active-health-probe',
          observedAt: telemetry.gateway.observedAt,
          sampleAgeMs: Math.max(0, now - new Date(telemetry.gateway.observedAt).getTime()),
          latencyMs: telemetry.gateway.latencyMs,
          latencyP95Ms: null,
          requestRateHz: null,
          errorRate: null,
        },
        ...instanceNodes,
      ],
      edges: [
        { from: 'nginx', to: 'app-backend-1' },
        { from: 'nginx', to: 'app-backend-2' },
      ],
    };
  }
}
