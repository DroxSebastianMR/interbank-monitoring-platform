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

  it('returns gateway probe and Prometheus telemetry per backend instance', async () => {
    const get = jest.fn((url: string, options?: { params?: { query?: string } }) => {
      if (url.endsWith('/health')) return of({ data: { status: 'ok' } });
      const query = options?.params?.query ?? '';
      const values = query.startsWith('up')
        ? [
            {
              metric: { instance: 'app-backend-1:3000' },
              value: [1_700_000_000, '1'],
            },
          ]
        : query.includes('histogram_quantile')
          ? [
              {
                metric: { instance: 'app-backend-1:3000' },
                value: [1_700_000_000, '42'],
              },
            ]
          : query.includes('status_code')
            ? [
                {
                  metric: { instance: 'app-backend-1:3000' },
                  value: [1_700_000_000, '0.1'],
                },
              ]
            : [
                {
                  metric: { instance: 'app-backend-1:3000' },
                  value: [1_700_000_000, '2'],
                },
              ];
      return of({ data: { status: 'success', data: { result: values } } });
    });
    const metrics = new PrometheusMetricsService(
      { get } as unknown as HttpService,
      new ConfigService({
        integrations: {
          prometheusUrl: 'http://prometheus:9090',
          appBackendUrl: 'http://nginx',
        },
      }),
    );

    const telemetry = await metrics.readInfrastructure(['app-backend-1', 'app-backend-2']);

    expect(telemetry.gateway.reachable).toBe(true);
    expect(telemetry.instances).toEqual([
      expect.objectContaining({
        id: 'app-backend-1',
        reachable: true,
        requestRateHz: 2,
        errorRate: 0.05,
        latencyP95Ms: 42,
      }),
    ]);
  });
});
