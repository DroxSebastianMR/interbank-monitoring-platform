import type { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { of } from 'rxjs';
import { EndpointPrometheusService } from '@/modules/endpoint-observability/services/endpoint-prometheus.service';

describe('EndpointPrometheusService', () => {
  const config = new ConfigService({ integrations: { prometheusUrl: 'http://prometheus:9090/' } });
  it('uses a fixed upstream, timeout, size bound, no redirects and common evaluation time', async () => {
    const get = jest.fn().mockReturnValue(
      of({
        data: {
          status: 'success',
          data: {
            resultType: 'vector',
            result: [{ metric: { instance: 'one' }, value: [100, '1'] }],
          },
        },
      }),
    );
    const service = new EndpointPrometheusService({ get } as unknown as HttpService, config);
    expect(await service.query('up', 100)).toHaveLength(1);
    expect(get).toHaveBeenCalledWith(
      'http://prometheus:9090/api/v1/query',
      expect.objectContaining({
        params: { query: 'up', time: 100 },
        maxRedirects: 0,
        timeout: 1500,
        maxContentLength: 5_000_000,
      }),
    );
  });
  it.each([
    { status: 'error' },
    { status: 'success', data: { resultType: 'matrix', result: [] } },
    {
      status: 'success',
      data: { resultType: 'vector', result: [{ metric: { route: 12 }, value: [1, '1'] }] },
    },
    {
      status: 'success',
      data: { resultType: 'vector', result: Array.from({ length: 10001 }, () => ({})) },
    },
  ])('rejects malformed/oversized responses', async (data: unknown) => {
    const get = jest.fn().mockReturnValue(of({ data }));
    const service = new EndpointPrometheusService({ get } as unknown as HttpService, config);
    await expect(service.query('up', 100)).rejects.toThrow();
  });
});
