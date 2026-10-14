export type ServiceStatus = 'OPERATIONAL' | 'DEGRADED' | 'UNAVAILABLE' | 'RECOVERING' | 'NO_DATA';

export interface MonitoredService {
  id: string;
  name: string;
  path?: string;
  status: ServiceStatus;
  lastCheckedAt: string | null;
  latencyMs: number | null;
  message: string;
  criticality?: string;
  monitoringEnabled?: boolean;
  version?: number;
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | null;
}

export interface ServiceConfigInput {
  code: string;
  name: string;
  endpoint: string;
  criticality: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface ServiceCheck {
  id: string;
  status: string;
  latencyMs: number;
  checkedAt: string;
  message: string | null;
}

export interface ServiceStateChange {
  id: string;
  fromStatus: string;
  toStatus: string;
  reason: string | null;
  changedAt: string;
}

export interface ServiceConfigChange {
  id: string;
  action: string;
  actorId: string | null;
  createdAt: string;
}

export interface ServiceInstances {
  instrumented: boolean;
  instances: Array<{ id: string; status: string; lastObservedAt: string | null }>;
}
