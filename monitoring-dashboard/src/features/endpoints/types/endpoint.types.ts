import type {
  EndpointTrafficState,
  TelemetryState,
} from "@/features/endpoints/enums/endpoint-state.enum";

export interface EndpointInstance {
  id: string;
  state: TelemetryState;
  observedAt: string | null;
  endpointCount: number;
}

export interface EndpointMetric {
  operationId?: string;
  application?: string;
  version?: string;
  controlPolicy?: string;
  latencyP50Ms?: number | null;
  latencyP99Ms?: number | null;
  instance: string;
  module: string;
  method: string;
  route: string;
  state: TelemetryState;
  traffic: EndpointTrafficState;
  observedAt: string | null;
  requestRateHz: number | null;
  clientErrorRateHz: number | null;
  serverErrorRateHz: number | null;
  latencyP95Ms: number | null;
  observedRequests: number | null;
}

export interface EndpointSnapshot {
  cursor?: { streamId: string; sequence: number };
  sourceState: TelemetryState;
  generatedAt: string;
  lastSuccessAt: string | null;
  refreshIntervalMs: number;
  windowSeconds: number;
  instances: EndpointInstance[];
  endpoints: EndpointMetric[];
}

export interface EndpointFilters {
  instance: string;
  module: string;
  method: string;
  search: string;
}
