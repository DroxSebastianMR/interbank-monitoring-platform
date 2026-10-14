import { registerAs } from '@nestjs/config';

export interface MonitoringConfig {
  intervalMs: number;
  timeoutMs: number;
}

export default registerAs('monitoring', (): MonitoringConfig => ({
  intervalMs: Number(process.env.MONITOR_INTERVAL_MS ?? 10_000),
  timeoutMs: Number(process.env.MONITOR_TIMEOUT_MS ?? 3_000),
}));
