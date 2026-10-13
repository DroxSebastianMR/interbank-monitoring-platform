import { EventEmitter } from 'node:events';
import { HttpMetricsService } from '@/modules/metrics/services/http-metrics.service';

describe('HttpMetricsService', () => {
  it('exports per-route response time without leaking IDs or query strings', () => {
    const metrics = new HttpMetricsService();
    const response = new EventEmitter() as EventEmitter & { statusCode: number };
    response.statusCode = 200;
    const next = jest.fn();

    metrics.observe(
      {
        method: 'POST',
        path: '/monitoring/private-service-id/check?secret=hidden',
        route: { path: '/monitoring/:id/check' },
      },
      response,
      next,
    );
    response.emit('finish');

    const exposition = metrics.metrics();
    expect(next).toHaveBeenCalledTimes(1);
    expect(exposition).toContain(
      'monitoring_backend_http_requests_total{method="POST",route="/monitoring/:id/check",status_code="200"} 1',
    );
    expect(exposition).toContain(
      'monitoring_backend_http_request_duration_seconds_count{method="POST",route="/monitoring/:id/check"} 1',
    );
    expect(exposition).not.toContain('private-service-id');
    expect(exposition).not.toContain('hidden');
  });

  it('does not count the metrics endpoint itself and bounds unknown routes', () => {
    const metrics = new HttpMetricsService();
    const response = new EventEmitter() as EventEmitter & { statusCode: number };
    response.statusCode = 404;
    metrics.observe({ method: 'GET', path: '/metrics' }, response, () => undefined);
    response.emit('finish');
    expect(metrics.metrics()).not.toContain('status_code="404"');

    metrics.observe({ method: 'GET', path: '/private/12345' }, response, () => undefined);
    response.emit('finish');
    expect(metrics.metrics()).toContain('route="/other"');
    expect(metrics.metrics()).not.toContain('12345');
  });
});
