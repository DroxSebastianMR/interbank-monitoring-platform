import { registerAs } from '@nestjs/config';

import type { AuthConfig } from '@/config/authentication/auth-config.interface';
import { AUTH_CONFIG_NAMESPACE, AUTH_DEFAULTS } from '@/config/authentication/auth.constants';

export default registerAs(AUTH_CONFIG_NAMESPACE, (): AuthConfig => ({
  jwtSecret: process.env.JWT_SECRET ?? '',
  sessionPepper: process.env.AUTH_SESSION_PEPPER ?? process.env.JWT_SECRET ?? '',
  accessTokenTtlSeconds: Number(
    process.env.JWT_ACCESS_TTL_SECONDS ?? AUTH_DEFAULTS.accessTokenTtlSeconds,
  ),
  sessionTtlSeconds: Number(
    process.env.AUTH_SESSION_TTL_SECONDS ?? AUTH_DEFAULTS.sessionTtlSeconds,
  ),
}));
