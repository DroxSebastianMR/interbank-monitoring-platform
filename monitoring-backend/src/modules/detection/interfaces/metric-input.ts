export interface MetricInput {
  /** Latest health probe duration in ms; never an HTTP histogram percentile. */
  latency: number;
  /** Legacy diagnostics retained for callers; historical probe rates do not trigger state changes. */
  errorRate: number;
  timeoutRate: number;
  availability: number;
  requestRate: number;
  healthCheckFailures: number;
  aiAnomalyScore: number;
  http?: { errorRate: number | null; latencyP95Ms: number | null } | null;
}
export interface DetectionResult {
  severity: 'NONE' | 'MEDIUM' | 'HIGH';
  reasons: string[];
}
