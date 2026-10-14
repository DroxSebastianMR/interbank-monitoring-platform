import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { DashboardRepository } from '@/modules/analytics/repositories/dashboard.repository';
import { MonitoredServicesService } from '@/modules/monitored-services/services/monitored-services.service';
import { ServiceStatus } from '@/modules/service-state/interfaces/service-state';
import type { DashboardMetricsQueryDto } from '@/modules/analytics/dto/dashboard-query.dto';

const STALE_AFTER_MS = 30_000;

@Injectable()
export class DashboardService {
  constructor(
    private readonly repository: DashboardRepository,
    private readonly services: MonitoredServicesService,
    private readonly config: ConfigService,
  ) {}

  async overview() {
    const generatedAt = new Date();
    const services = this.services.findAll();
    const { checks, incidents, alerts, activeIncidentsCount, activeAlertsCount } =
      await this.repository.snapshot(new Date(generatedAt.getTime() - 60 * 60_000));
    const statusFor = (
      checkedAt: string | null,
      status: ServiceStatus,
      enabled: boolean,
    ): ServiceStatus | 'NO_DATA' =>
      !enabled ||
      !checkedAt ||
      generatedAt.getTime() - new Date(checkedAt).getTime() > STALE_AFTER_MS
        ? 'NO_DATA'
        : status;
    const summaries = services.map((service) => ({
      id: service.id,
      name: service.name,
      status: statusFor(service.lastCheckedAt, service.status, service.monitoringEnabled !== false),
      lastCheckedAt: service.lastCheckedAt,
      latencyMs: service.lastCheckedAt ? service.latencyMs : null,
      monitoringEnabled: service.monitoringEnabled !== false,
    }));
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
        ? generatedAt.getTime() - new Date(lastObservationAt).getTime() <= STALE_AFTER_MS
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

  topology() {
    return {
      source: 'configured-laboratory-topology',
      observedAt: null,
      nodes: [
        { id: 'nginx', kind: 'gateway', status: 'NO_DATA' },
        { id: 'app-backend-1', kind: 'instance', status: 'NO_DATA' },
        { id: 'app-backend-2', kind: 'instance', status: 'NO_DATA' },
      ],
      edges: [
        { from: 'nginx', to: 'app-backend-1' },
        { from: 'nginx', to: 'app-backend-2' },
      ],
    };
  }
}
