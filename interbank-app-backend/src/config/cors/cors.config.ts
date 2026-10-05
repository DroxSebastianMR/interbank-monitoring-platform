import type { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

import {
  CORS_ALLOWED_HEADERS,
  CORS_EXPOSED_HEADERS,
  CORS_METHODS,
  CORS_PREFLIGHT_MAX_AGE_SECONDS,
  DEFAULT_CORS_ORIGINS,
} from '@/config/cors/cors.constants';

export function parseCorsOrigins(value?: string): string[] {
  if (!value?.trim()) return [...DEFAULT_CORS_ORIGINS];

  return value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export function buildCorsOptions(origins: string[]): CorsOptions {
  const allowEveryOrigin = origins.includes('*');

  return {
    origin: allowEveryOrigin ? true : origins,
    credentials: !allowEveryOrigin,
    methods: CORS_METHODS,
    allowedHeaders: CORS_ALLOWED_HEADERS,
    exposedHeaders: CORS_EXPOSED_HEADERS,
    maxAge: CORS_PREFLIGHT_MAX_AGE_SECONDS,
  };
}
