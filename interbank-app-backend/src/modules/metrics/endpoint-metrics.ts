import type { OpenAPIObject } from '@nestjs/swagger';
import { Counter, Gauge, Histogram } from '@prometheus-io/client';

import { httpMetricsRegistry } from '@/modules/metrics/metrics.registry';

const methods = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options', 'trace'] as const;
type EndpointLabels = { module: string; method: string; route: string };
const catalog = new Map<string, EndpointLabels>();
const info = new Gauge({
  name: 'interbank_app_endpoint_info',
  help: 'Declared OpenAPI operations, including operations with no traffic',
  labelNames: ['module', 'method', 'route'] as const,
  registers: [httpMetricsRegistry],
});
const requests = new Counter({
  name: 'interbank_app_endpoint_requests_total',
  help: 'Completed requests per declared operation and bounded HTTP status class',
  labelNames: ['module', 'method', 'route', 'status_class'] as const,
  registers: [httpMetricsRegistry],
});
const duration = new Histogram({
  name: 'interbank_app_endpoint_request_duration_seconds',
  help: 'Server request duration per declared operation, not browser round trip',
  labelNames: ['module', 'method', 'route'] as const,
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  registers: [httpMetricsRegistry],
});

/** Startup only. Never probe an operation or use user input as a metric label. */
export function registerEndpointCatalog(document: OpenAPIObject): void {
  catalog.clear();
  info.reset();
  requests.reset();
  duration.reset();
  for (const [route, item] of Object.entries(document.paths)) {
    for (const method of methods) {
      const operation = item?.[method];
      if (!operation) continue;
      const labels = {
        module: operation.tags?.[0] ?? route.split('/').filter(Boolean)[0] ?? 'root',
        method: method.toUpperCase(),
        route,
      };
      catalog.set(`${labels.method} ${route}`, labels);
      info.set(labels, 1);
      if (route !== '/metrics') {
        for (const statusClass of ['1xx', '2xx', '3xx', '4xx', '5xx']) {
          requests.inc({ ...labels, status_class: statusClass }, 0);
        }
        duration.zero(labels);
      }
    }
  }
}

export function observeEndpoint(
  method: string,
  matchedPath: unknown,
  statusCode: number,
  seconds: number,
): void {
  if (typeof matchedPath !== 'string') return;
  const route = matchedPath.replace(/:([A-Za-z0-9_]+)/g, '{$1}');
  const labels = catalog.get(`${method.toUpperCase()} ${route}`);
  if (!labels || route === '/metrics') return;
  if (statusCode < 100 || statusCode > 599) return;
  requests.inc({ ...labels, status_class: `${Math.floor(statusCode / 100)}xx` });
  duration.observe(labels, seconds);
}
