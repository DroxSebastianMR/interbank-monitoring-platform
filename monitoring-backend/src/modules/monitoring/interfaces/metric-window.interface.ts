export interface MetricWindow {
  serviceId: string;
  windowStart: string;
  windowEnd: string;
  sampleCount: number;
  latencyP95Ms: number;
  errorRate: number;
  timeoutRate: number;
  requestRate: number;
  availability: number;
}

export interface CheckSample {
  at: number;
  latencyMs: number;
  reachable: boolean;
  timedOut: boolean;
}
