import { registerAs } from '@nestjs/config';

export interface RulesConfig {
  latencyThresholdMs: number;
  maxHealthFailures: number;
}

export default registerAs('rules', (): RulesConfig => ({
  latencyThresholdMs: Number(process.env.LATENCY_THRESHOLD_MS ?? 1_000),
  maxHealthFailures: Number(process.env.MAX_HEALTH_FAILURES ?? 3),
}));
