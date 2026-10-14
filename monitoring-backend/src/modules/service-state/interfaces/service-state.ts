export enum ServiceStatus {
  OPERATIONAL = 'OPERATIONAL',
  DEGRADED = 'DEGRADED',
  UNAVAILABLE = 'UNAVAILABLE',
  RECOVERING = 'RECOVERING',
}
export interface ServiceSnapshot {
  id: string;
  name: string;
  path: string;
  status: ServiceStatus;
  lastCheckedAt: string | null;
  latencyMs: number | null;
  consecutiveFailures: number;
  consecutiveSuccesses?: number;
  message: string;
  criticality?: string;
  monitoringEnabled?: boolean;
  version?: number;
  pausedReason?: string | null;
  anomalyScore?: number | null;
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | null;
}
