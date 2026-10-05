export interface MetricInput {
  latency: number;
  errorRate: number;
  timeoutRate: number;
  availability: number;
  requestRate: number;
  healthCheckFailures: number;
  aiAnomalyScore: number;
}
export interface DetectionResult {
  severity: 'NONE' | 'MEDIUM' | 'HIGH';
  reasons: string[];
}
