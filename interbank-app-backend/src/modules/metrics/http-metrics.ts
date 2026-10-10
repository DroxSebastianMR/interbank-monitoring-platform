import { Counter, Histogram, Registry, collectDefaultMetrics } from '@prometheus-io/client';
import type { Request, Response, NextFunction } from 'express';

export const httpMetricsRegistry = new Registry();
collectDefaultMetrics({ register: httpMetricsRegistry, prefix: 'interbank_app_' });

const requests = new Counter({
  name: 'interbank_app_http_requests_total',
  help: 'Completed HTTP requests by logical service and response status',
  labelNames: ['service', 'status_code'] as const,
  registers: [httpMetricsRegistry],
});

const duration = new Histogram({
  name: 'interbank_app_http_request_duration_seconds',
  help: 'HTTP request duration by logical service',
  labelNames: ['service'] as const,
  buckets: [0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2, 5],
  registers: [httpMetricsRegistry],
});

const knownServices = new Set(['auth', 'accounts', 'transfers', 'service-payments', 'home']);

export function logicalService(path: string): string {
  const segment = path.split('?')[0]?.split('/').filter(Boolean)[0] ?? 'other';
  return knownServices.has(segment) ? segment : 'other';
}

export function observeHttpRequest(request: Request, response: Response, next: NextFunction): void {
  if (request.path === '/metrics' || request.path.endsWith('/health') || request.path === '/health')
    return next();
  const service = logicalService(request.path);
  const started = process.hrtime.bigint();
  response.once('finish', () => {
    const seconds = Number(process.hrtime.bigint() - started) / 1_000_000_000;
    requests.inc({ service, status_code: String(response.statusCode) });
    duration.observe({ service }, seconds);
  });
  next();
}
