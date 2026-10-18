import { Counter, Gauge, Histogram } from '@prometheus-io/client';
import type { Request, Response, NextFunction } from 'express';

import { httpMetricsRegistry } from '@/modules/metrics/metrics.registry';
import { observeEndpoint } from '@/modules/metrics/endpoint-metrics';
export { httpMetricsRegistry } from '@/modules/metrics/metrics.registry';

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
const inFlight = new Gauge({ name: 'interbank_app_http_in_flight', help: 'Requests currently in flight in this process, excluding metrics', registers: [httpMetricsRegistry] });
const aborted = new Counter({ name: 'interbank_app_http_aborted_total', help: 'Connections closed before response completion; not necessarily server timeouts', registers: [httpMetricsRegistry] });

export function logicalService(path: string): string {
  const segment = path.split('?')[0]?.split('/').filter(Boolean)[0] ?? 'other';
  return knownServices.has(segment) ? segment : 'other';
}

export function observeHttpRequest(request: Request, response: Response, next: NextFunction): void {
  if (request.path === '/metrics') return next();
  const isHealth = request.path.endsWith('/health') || request.path === '/health';
  const service = logicalService(request.path);
  const started = process.hrtime.bigint();
  inFlight.inc();
  let released = false;
  const release = () => { if (!released) { released = true; inFlight.dec(); } };
  response.once('close', () => { if (!released) aborted.inc(); release(); });
  response.once('finish', () => {
    release();
    const seconds = Number(process.hrtime.bigint() - started) / 1_000_000_000;
    if (!isHealth) {
      requests.inc({ service, status_code: String(response.statusCode) });
      duration.observe({ service }, seconds);
    }
    const route: unknown = request.route;
    const matchedPath =
      route && typeof route === 'object' && 'path' in route ? route.path : undefined;
    observeEndpoint(request.method ?? '', matchedPath, response.statusCode, seconds);
  });
  next();
}
