import type { MonitoredService, ServiceStatus } from '@/features/services/types/service.types';

export interface DashboardOverview {
  generatedAt: string;
  environment: string;
  overallStatus: ServiceStatus;
  monitoredServicesCount: number;
  operationalCount: number;
  degradedCount: number;
  unavailableCount: number;
  noDataCount: number;
  activeIncidentsCount: number;
  activeAlertsCount: number;
  availability: number | null;
  latencyP95Ms: number | null;
  errorRate: number | null;
  lastObservationAt: string | null;
  dataFreshness: 'CURRENT' | 'STALE' | 'NO_DATA';
  services: Array<Pick<MonitoredService, 'id' | 'name' | 'status' | 'lastCheckedAt' | 'latencyMs' | 'monitoringEnabled'>>;
  recentIncidents: Array<{ id: string; title: string; severity: string; openedAt: string; serviceKey: string }>;
  recentAlerts: Array<{ id: string; message: string; createdAt: string }>;
  sources: { healthChecks: string; incidents: string; alerts: string; httpErrorRate: string };
}

export interface MetricSeries {
  source: string;
  metric: string;
  unit: string;
  points: Array<{ serviceId: string; timestamp: string; value: number }>;
  truncated: boolean;
}

export interface ActivityItem {
  id: string;
  type: 'INCIDENT' | 'ALERT';
  serviceId: string;
  timestamp: string;
  severity: string | null;
  description: string;
}

export interface DashboardTopology {
  source: string;
  observedAt: string | null;
  sampling: {
    recommendedIntervalMs: number;
    frequencyHz: number;
  };
  nodes: Array<{
    id: string;
    kind: string;
    status: string;
    telemetrySource: string;
    observedAt: string | null;
    sampleAgeMs: number | null;
    latencyMs: number | null;
    latencyP95Ms: number | null;
    requestRateHz: number | null;
    errorRate: number | null;
  }>;
  edges: Array<{ from: string; to: string }>;
}
