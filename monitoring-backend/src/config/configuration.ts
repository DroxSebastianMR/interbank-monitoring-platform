export default () => ({
  port: Number(process.env.MONITORING_PORT ?? 4000),
  redis: {
    host: process.env.REDIS_HOST ?? 'localhost',
    port: Number(process.env.REDIS_PORT ?? 6379),
  },
  aiServiceUrl: process.env.AI_SERVICE_URL ?? 'http://localhost:8000',
  appBackendUrl: process.env.APP_BACKEND_URL ?? 'http://localhost:8080',
  corsOrigins: process.env.CORS_ORIGINS,
  auth: {
    jwtSecret: process.env.JWT_SECRET,
    accessTokenTtlSeconds: Number(process.env.JWT_ACCESS_TTL_SECONDS ?? 900),
    refreshTokenTtlSeconds: Number(process.env.JWT_REFRESH_TTL_SECONDS ?? 2_592_000),
    maxFailedAttempts: Number(process.env.AUTH_MAX_FAILED_ATTEMPTS ?? 5),
    lockMinutes: Number(process.env.AUTH_LOCK_MINUTES ?? 15),
  },
  monitor: {
    intervalMs: Number(process.env.MONITOR_INTERVAL_MS ?? 10000),
    timeoutMs: Number(process.env.MONITOR_TIMEOUT_MS ?? 3000),
  },
  rules: {
    latencyThresholdMs: Number(process.env.LATENCY_THRESHOLD_MS ?? 1000),
    maxHealthFailures: Number(process.env.MAX_HEALTH_FAILURES ?? 2),
  },
});
