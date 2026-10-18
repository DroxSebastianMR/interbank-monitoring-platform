import { ENDPOINT_QUERIES } from '@/modules/endpoint-observability/constants/endpoint-observability.constants';
import {
  EndpointTrafficState,
  TelemetryState,
} from '@/modules/endpoint-observability/enums/endpoint-state.enum';
import { EndpointObservabilityService } from '@/modules/endpoint-observability/services/endpoint-observability.service';
import type { EndpointPrometheusService } from '@/modules/endpoint-observability/services/endpoint-prometheus.service';
import type { PrometheusSample } from '@/modules/endpoint-observability/types/prometheus-vector.type';

describe('EndpointObservabilityService', () => {
  const time = 1_800_000_000_000;
  const a = {
    instance: 'app-backend-1:3000',
    module: 'Auth',
    method: 'POST',
    route: '/auth/login',
  };
  const b = { ...a, instance: 'app-backend-2:3000' };
  const sample = (metric: Record<string, string>, value: number | string): PrometheusSample => ({
    metric,
    value: [time / 1000, String(value)],
  });
  let vectors: Record<string, PrometheusSample[]>;
  let query: jest.Mock<Promise<PrometheusSample[]>, [string, number]>;
  let service: EndpointObservabilityService;
  beforeEach(() => {
    jest.spyOn(Date, 'now').mockReturnValue(time);
    vectors = {
      [ENDPOINT_QUERIES.catalog]: [sample(a, 1), sample(b, 1)],
      [ENDPOINT_QUERIES.up]: [sample(a, 1), sample(b, 1)],
      [ENDPOINT_QUERIES.scrapedAt]: [sample(a, time / 1000 - 5), sample(b, time / 1000 - 5)],
      [ENDPOINT_QUERIES.total]: [sample(a, 100)],
      [ENDPOINT_QUERIES.rate]: [sample(a, 10)],
      [ENDPOINT_QUERIES.clientErrors]: [sample(a, 2)],
      [ENDPOINT_QUERIES.serverErrors]: [sample(a, 1)],
      [ENDPOINT_QUERIES.p95]: [sample(a, 0.123)],
    };
    query = jest.fn<Promise<PrometheusSample[]>, [string, number]>((promql) =>
      Promise.resolve(vectors[promql] ?? []),
    );
    service = new EndpointObservabilityService({ query } as unknown as EndpointPrometheusService);
  });
  afterEach(() => jest.restoreAllMocks());

  it('joins by instance AND operation; preserves routes with no requests', async () => {
    const result = await service.snapshot();
    expect(result.endpoints[0]).toMatchObject({
      instance: a.instance,
      requestRateHz: 10,
      latencyP95Ms: 123,
      clientErrorRateHz: 2,
      serverErrorRateHz: 1,
      traffic: EndpointTrafficState.OBSERVED,
    });
    expect(result.endpoints[1]).toMatchObject({
      instance: b.instance,
      requestRateHz: 0,
      latencyP95Ms: null,
      traffic: EndpointTrafficState.NO_TRAFFIC,
    });
    expect(result.instances[0].observedAt).toBe(new Date(time - 5000).toISOString());
    expect(query).toHaveBeenCalledTimes(8);
  });

  it('coalesces concurrent requests and serves the cached snapshot without more upstream queries', async () => {
    const results = await Promise.all(Array.from({ length: 100 }, () => service.snapshot()));
    expect(new Set(results).size).toBe(1);
    await service.snapshot();
    expect(query).toHaveBeenCalledTimes(8);
  });

  it('uses eight grouped queries even for a thousand operations', async () => {
    vectors[ENDPOINT_QUERIES.catalog] = Array.from({ length: 1000 }, (_, i) =>
      sample({ ...a, route: `/test-${i}/{id}` }, 1),
    );
    expect((await service.snapshot()).endpoints).toHaveLength(1000);
    expect(query).toHaveBeenCalledTimes(8);
  });

  it('does not reuse old rates when an instance stops responding to scrapes', async () => {
    vectors[ENDPOINT_QUERIES.up] = [sample(a, 0), sample(b, 1)];
    const result = await service.snapshot();
    expect(result.endpoints[0]).toMatchObject({
      state: TelemetryState.UNAVAILABLE,
      requestRateHz: null,
      latencyP95Ms: null,
      traffic: EndpointTrafficState.UNKNOWN,
    });
    expect(result.endpoints[1].state).toBe(TelemetryState.AVAILABLE);
  });

  it('uses scrape time, not query evaluation time, to reject stale up=1', async () => {
    vectors[ENDPOINT_QUERIES.scrapedAt] = [sample(a, time / 1000 - 40)];
    const result = await service.snapshot();
    expect(result.endpoints[0].state).toBe(TelemetryState.STALE);
    expect(result.endpoints[0].requestRateHz).toBeNull();
    expect(result.endpoints[1].state).toBe(TelemetryState.UNKNOWN);
  });

  it('keeps a bounded last-known catalog during collector failure, never stale numeric metrics', async () => {
    await service.snapshot();
    jest.spyOn(Date, 'now').mockReturnValue(time + 6000);
    query.mockRejectedValue(new Error('upstream details must not leak'));
    const fallback = await service.snapshot();
    expect(fallback.sourceState).toBe(TelemetryState.STALE);
    expect(fallback.endpoints[0].requestRateHz).toBeNull();
    expect(JSON.stringify(fallback)).not.toContain('upstream details');
    jest.spyOn(Date, 'now').mockReturnValue(time + 61_000);
    expect((await service.snapshot()).endpoints).toHaveLength(0);
  });

  it('replaces the catalog after deployments and handles cold failure explicitly', async () => {
    await service.snapshot();
    jest.spyOn(Date, 'now').mockReturnValue(time + 6000);
    vectors[ENDPOINT_QUERIES.catalog] = [sample({ ...a, route: '/new-module' }, 1)];
    const result = await service.snapshot();
    expect(result.endpoints.map((endpoint) => endpoint.route)).toEqual(['/new-module']);
    const cold = new EndpointObservabilityService({
      query: jest.fn().mockRejectedValue(new Error('offline')),
    } as unknown as EndpointPrometheusService);
    expect((await cold.snapshot()).sourceState).toBe(TelemetryState.UNAVAILABLE);
  });

  it('does not serialize NaN as a latency and marks rates needing more scrapes', async () => {
    vectors[ENDPOINT_QUERIES.rate] = [];
    vectors[ENDPOINT_QUERIES.p95] = [sample(a, 'NaN')];
    const result = await service.snapshot();
    expect(result.endpoints[0]).toMatchObject({
      traffic: EndpointTrafficState.WARMING_UP,
      requestRateHz: null,
      latencyP95Ms: null,
    });
  });
});
