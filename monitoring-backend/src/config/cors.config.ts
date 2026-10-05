import type { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

const defaultOrigins = ['http://localhost:5173'];

export function parseCorsOrigins(value?: string): string[] {
  if (!value?.trim()) return defaultOrigins;

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
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Accept', 'Authorization', 'Content-Type', 'X-Request-Id'],
    exposedHeaders: ['X-Request-Id'],
    maxAge: 86_400,
  };
}
