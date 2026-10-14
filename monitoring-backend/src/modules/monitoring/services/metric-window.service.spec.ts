import { MetricWindowService } from '@/modules/monitoring/services/metric-window.service';

describe('MetricWindowService', () => {
  it('aggregates p95, failures and timeouts per service', () => {
    const service = new MetricWindowService();
    service.record('login', { at: 100_000, latencyMs: 10, reachable: true, timedOut: false });
    service.record('login', { at: 110_000, latencyMs: 30, reachable: false, timedOut: true });
    const window = service.record('login', {
      at: 120_000,
      latencyMs: 20,
      reachable: true,
      timedOut: false,
    });

    expect(window).toMatchObject({
      serviceId: 'login',
      sampleCount: 3,
      latencyP95Ms: 30,
      errorRate: 1 / 3,
      timeoutRate: 1 / 3,
      availability: 2 / 3,
    });
    expect(
      service.record('balance', { at: 120_000, latencyMs: 5, reachable: true, timedOut: false })
        .sampleCount,
    ).toBe(1);
  });

  it('drops samples outside the minute window', () => {
    const service = new MetricWindowService();
    service.record('login', { at: 100_000, latencyMs: 10, reachable: false, timedOut: false });
    const window = service.record('login', {
      at: 161_000,
      latencyMs: 20,
      reachable: true,
      timedOut: false,
    });
    expect(window.sampleCount).toBe(1);
    expect(window.errorRate).toBe(0);
  });
});
