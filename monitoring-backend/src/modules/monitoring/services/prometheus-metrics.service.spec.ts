import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { of, throwError } from 'rxjs';
import { PrometheusMetricsService } from '@/modules/monitoring/services/prometheus-metrics.service';

describe('PrometheusMetricsService', () => {
  const config = new ConfigService({ prometheusUrl: 'http://prometheus:9090' });

  it('returns bounded error rate and millisecond p95 for a known service', async () => {
    const get = jest
      .fn()
      .mockReturnValueOnce(
        of({ data: { status: 'success', data: { result: [{ value: [0, '10'] }] } } }),
      )
      .mockReturnValueOnce(
        of({ data: { status: 'success', data: { result: [{ value: [0, '2'] }] } } }),
      )
      .mockReturnValueOnce(
        of({ data: { status: 'success', data: { result: [{ value: [0, '150'] }] } } }),
      );
    const metrics = new PrometheusMetricsService({ get } as unknown as HttpService, config);
    await expect(metrics.read('login')).resolves.toEqual({
      requestRate: 10,
      errorRate: 0.2,
      latencyP95Ms: 150,
    });
    expect(get).toHaveBeenCalledTimes(3);
    const calls = get.mock.calls as unknown as Array<[string, { params: { query: string } }]>;
    const firstRequest = calls[0]?.[1];
    expect(firstRequest.params.query).toContain('service="auth"');
  });

  it('falls back when Prometheus is unavailable or no traffic exists', async () => {
    const offline = new PrometheusMetricsService(
      {
        get: jest.fn().mockReturnValue(throwError(() => new Error('offline'))),
      } as unknown as HttpService,
      config,
    );
    await expect(offline.read('login')).resolves.toBeNull();
    await expect(offline.read('unknown')).resolves.toBeNull();
  });
});
