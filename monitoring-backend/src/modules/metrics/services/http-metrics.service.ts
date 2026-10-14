import { Injectable } from '@nestjs/common';

const DURATION_BUCKETS_SECONDS = [0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2, 5] as const;
const KNOWN_ROUTES = new Set([
  '/auth/login',
  '/auth/refresh',
  '/auth/logout',
  '/auth/me',
  '/access-control/roles',
  '/access-control/permissions',
  '/access-control/employees/:employeeId/roles',
  '/health',
  '/monitored-services',
  '/monitoring/run',
  '/monitoring/:id/check',
  '/ai/health',
  '/ai/predict',
  '/assistant/ask',
  '/incidents',
  '/alerts',
  '/analytics/summary',
  '/audit',
  '/notifications',
]);

interface RequestSummary {
  method: string;
  path: string;
  route?: { path: string };
}

interface ResponseSummary {
  statusCode: number;
  once(event: 'finish', listener: () => void): void;
}

interface DurationSeries {
  method: string;
  route: string;
  count: number;
  sum: number;
  buckets: number[];
}

interface RequestSeries {
  method: string;
  route: string;
  statusCode: number;
  count: number;
}

function routeLabel(request: RequestSummary): string {
  const pattern = request.route?.path;
  if (pattern && KNOWN_ROUTES.has(pattern)) return pattern;
  if (KNOWN_ROUTES.has(request.path)) return request.path;
  return '/other';
}

@Injectable()
export class HttpMetricsService {
  private readonly requests = new Map<string, RequestSeries>();
  private readonly durations = new Map<string, DurationSeries>();

  observe(request: RequestSummary, response: ResponseSummary, next: () => void): void {
    if (request.path === '/metrics') return next();
    const started = process.hrtime.bigint();
    response.once('finish', () => {
      const seconds = Number(process.hrtime.bigint() - started) / 1_000_000_000;
      const method = request.method.toUpperCase();
      const route = routeLabel(request);
      const statusCode = response.statusCode;
      const requestKey = `${method}|${route}|${statusCode}`;
      const requestSeries = this.requests.get(requestKey) ?? {
        method,
        route,
        statusCode,
        count: 0,
      };
      requestSeries.count += 1;
      this.requests.set(requestKey, requestSeries);

      const durationKey = `${method}|${route}`;
      const durationSeries = this.durations.get(durationKey) ?? {
        method,
        route,
        count: 0,
        sum: 0,
        buckets: DURATION_BUCKETS_SECONDS.map(() => 0),
      };
      durationSeries.count += 1;
      durationSeries.sum += seconds;
      DURATION_BUCKETS_SECONDS.forEach((upperBound, index) => {
        if (seconds <= upperBound) durationSeries.buckets[index] += 1;
      });
      this.durations.set(durationKey, durationSeries);
    });
    next();
  }

  metrics(): string {
    const lines = [
      '# HELP monitoring_backend_up Monitoring backend availability',
      '# TYPE monitoring_backend_up gauge',
      'monitoring_backend_up 1',
      '# HELP monitoring_backend_http_requests_total Completed HTTP requests by route and status',
      '# TYPE monitoring_backend_http_requests_total counter',
    ];
    for (const series of this.requests.values()) {
      lines.push(
        `monitoring_backend_http_requests_total{method="${series.method}",route="${series.route}",status_code="${series.statusCode}"} ${series.count}`,
      );
    }
    lines.push(
      '# HELP monitoring_backend_http_request_duration_seconds HTTP response duration by route',
      '# TYPE monitoring_backend_http_request_duration_seconds histogram',
    );
    for (const series of this.durations.values()) {
      const labels = `method="${series.method}",route="${series.route}"`;
      DURATION_BUCKETS_SECONDS.forEach((upperBound, index) => {
        lines.push(
          `monitoring_backend_http_request_duration_seconds_bucket{${labels},le="${upperBound}"} ${series.buckets[index]}`,
        );
      });
      lines.push(
        `monitoring_backend_http_request_duration_seconds_bucket{${labels},le="+Inf"} ${series.count}`,
        `monitoring_backend_http_request_duration_seconds_sum{${labels}} ${series.sum}`,
        `monitoring_backend_http_request_duration_seconds_count{${labels}} ${series.count}`,
      );
    }
    return `${lines.join('\n')}\n`;
  }
}
