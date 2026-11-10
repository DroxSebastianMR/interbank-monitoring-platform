import { registerAs } from '@nestjs/config';

export interface RulesConfig {
  version: string;
  latencyThresholdMs: number;
  maxHealthFailures: number;
  degradationSamples: number;
  degradationDurationMs: number;
  recoverySamples: number;
  observationMaxAgeMs: number;
  httpErrorRateThreshold: number;
}

export default registerAs('rules', (): RulesConfig => ({
  version: 'operational-v1',
  latencyThresholdMs: Number(process.env.LATENCY_THRESHOLD_MS ?? 1_000),
  maxHealthFailures: Number(process.env.MAX_HEALTH_FAILURES ?? 3),
  degradationSamples: Number(process.env.DEGRADATION_SAMPLES ?? 3),
  degradationDurationMs: Number(process.env.DEGRADATION_DURATION_MS ?? 20_000),
  recoverySamples: Number(process.env.RECOVERY_SAMPLES ?? 3),
  observationMaxAgeMs: Number(process.env.OBSERVATION_MAX_AGE_MS ?? 30_000),
  httpErrorRateThreshold: Number(process.env.HTTP_ERROR_RATE_THRESHOLD ?? 0.1),
}));
