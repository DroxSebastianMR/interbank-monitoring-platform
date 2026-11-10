export type RuleProfile = {
  version: string;
  latencyThresholdMs: number;
  maxHealthFailures: number;
  degradationSamples: number;
  degradationDurationMs: number;
  recoverySamples: number;
  observationMaxAgeMs: number;
  httpErrorRateThreshold: number;
};

export type OperationalEvaluation = {
  schemaVersion: 1;
  serviceVersion: number;
  observedAt: string;
  profile: RuleProfile;
  probe: {
    source: 'health-probe';
    reachable: boolean;
    timedOut: boolean;
    latencyMs: number;
    sampleCount: number;
    windowStart: string;
    windowEnd: string;
    latencyP95Ms: number;
    failureRate: number;
    timeoutRate: number;
  };
  http: {
    source: 'prometheus-http';
    queriedAt: string;
    windowSeconds: 60;
    requestRate: number;
    errorRate: number | null;
    latencyP95Ms: number | null;
  } | null;
  risk: {
    source: 'probe-window-with-http-rate';
    httpRequestRateHz: number | null;
    status: 'AVAILABLE' | 'INSUFFICIENT_DATA' | 'UNAVAILABLE';
    score: number | null;
    level: 'LOW' | 'MEDIUM' | 'HIGH' | null;
  };
  reasons: string[];
  consecutiveDegradations: number;
  firstSignalAt: string | null;
  confirmedAt: string | null;
  lastConfirmedStatus: 'OPERATIONAL' | 'DEGRADED' | 'UNAVAILABLE' | null;
  pendingConfirmation: boolean;
  healthy: boolean;
  technicalDataAvailable: boolean;
  requiresHttpRecovery: boolean;
};
