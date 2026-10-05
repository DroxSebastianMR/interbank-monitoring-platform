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
  message: string;
}
