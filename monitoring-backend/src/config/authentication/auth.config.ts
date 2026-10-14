import { registerAs } from '@nestjs/config';

import type { AuthConfig } from '@/config/authentication/auth-config.interface';

export default registerAs('auth', (): AuthConfig => ({
  jwtSecret: process.env.JWT_SECRET!,
  accessTokenTtlSeconds: Number(process.env.JWT_ACCESS_TTL_SECONDS ?? 900),
  refreshTokenTtlSeconds: Number(process.env.JWT_REFRESH_TTL_SECONDS ?? 2_592_000),
  maxFailedAttempts: Number(process.env.AUTH_MAX_FAILED_ATTEMPTS ?? 5),
  lockMinutes: Number(process.env.AUTH_LOCK_MINUTES ?? 15),
}));
