import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { of, throwError } from 'rxjs';
import { AiIntegrationService } from '@/modules/ai-integration/services/ai-integration.service';
import { DetectionService } from '@/modules/detection/services/detection.service';
import { IncidentsService } from '@/modules/incidents/services/incidents.service';
import { MonitoredServicesService } from '@/modules/monitored-services/services/monitored-services.service';
import { MetricWindowService } from '@/modules/monitoring/services/metric-window.service';
import { MonitoringService } from '@/modules/monitoring/services/monitoring.service';
import { PrometheusMetricsService } from '@/modules/monitoring/services/prometheus-metrics.service';
import { ServiceStateService } from '@/modules/service-state/services/service-state.service';
import { ServiceStatus } from '@/modules/service-state/interfaces/service-state';

function fixture() {
  jest.useFakeTimers();
  jest.setSystemTime(new Date('2026-10-29T12:00:00Z'));
  let slow = false;
  let fail = false;
  const get = jest.fn(() => {
    jest.setSystemTime(Date.now() + (slow ? 1500 : 20));
    return fail ? throwError(() => new Error('timeout')) : of({ data: { status: 'ok', service: 'auth' } });
  });
  const config = new ConfigService({ rules: { maxHealthFailures: 3, latencyThresholdMs: 1000 } });
  const catalog = new MonitoredServicesService(undefined, config);
  const read = jest.fn().mockResolvedValue({ requestRate: 12, errorRate: 0, latencyP95Ms: 80 });
  const analyzeWindow = jest.fn().mockResolvedValue({ serviceId: 'login', status: 'OK', anomalyScore: 0.99, riskLevel: 'HIGH' });
  const sync = jest.fn().mockResolvedValue(undefined);
  const monitor = new MonitoringService(
    { get } as unknown as HttpService, config, catalog, new DetectionService(config),
    new ServiceStateService(), new MetricWindowService(),
    { read } as unknown as PrometheusMetricsService,
    { analyzeWindow } as unknown as AiIntegrationService,
    { sync } as unknown as IncidentsService,
  );
  return { monitor, catalog, read, sync, slow: () => { slow = true; }, fail: () => { fail = true; }, healthy: () => { fail = false; slow = false; } };
}

afterEach(() => jest.useRealTimers());

describe('operational consistency', () => {
  it('keeps high AI risk independent from technical state and incidents', async () => {
    const app = fixture();
    for (let i = 0; i < 3; i++) await app.monitor.check('login');
    expect(app.catalog.find('login')).toMatchObject({ status: 'OPERATIONAL', riskLevel: 'HIGH' });
    expect(app.sync.mock.calls.every((call) => call[1] === ServiceStatus.OPERATIONAL)).toBe(true);
  });

  it('confirms sustained slowness only after both count and duration', async () => {
    const app = fixture();
    await app.monitor.check('login');
    app.slow();
    for (let i = 0; i < 3; i++) await app.monitor.check('login');
    expect(app.catalog.find('login')?.evaluation?.pendingConfirmation).toBe(true);
    jest.setSystemTime(Date.now() + 20_000);
    expect((await app.monitor.check('login'))?.status).toBe(ServiceStatus.DEGRADED);
    expect(app.catalog.find('login')?.evaluation?.confirmedAt).not.toBeNull();
  });

  it('recovers after three healthy checks without old failures poisoning the window', async () => {
    const app = fixture();
    app.fail();
    for (let i = 0; i < 3; i++) await app.monitor.check('login');
    expect(app.catalog.find('login')?.status).toBe(ServiceStatus.UNAVAILABLE);
    app.healthy();
    expect((await app.monitor.check('login'))?.status).toBe(ServiceStatus.RECOVERING);
    expect((await app.monitor.check('login'))?.status).toBe(ServiceStatus.RECOVERING);
    expect((await app.monitor.check('login'))?.status).toBe(ServiceStatus.OPERATIONAL);
  });

  it('expires observations without rewriting the last confirmed state or resolving incidents', async () => {
    const app = fixture();
    await app.monitor.check('login');
    const calls = app.sync.mock.calls.length;
    jest.setSystemTime(Date.now() + 30_001);
    expect(app.catalog.observed('login')).toMatchObject({ status: 'NO_DATA', lastKnownStatus: 'OPERATIONAL', dataFreshness: 'STALE' });
    expect(app.catalog.find('login')?.status).toBe(ServiceStatus.OPERATIONAL);
    expect(app.sync).toHaveBeenCalledTimes(calls);
  });

  it('returns to the confirmed affected state if recovery is interrupted', async () => {
    const app = fixture();
    app.fail();
    for (let i = 0; i < 3; i++) await app.monitor.check('login');
    app.healthy();
    expect((await app.monitor.check('login'))?.status).toBe(ServiceStatus.RECOVERING);
    app.fail();
    expect((await app.monitor.check('login'))?.status).toBe(ServiceStatus.UNAVAILABLE);
    expect(app.catalog.find('login')?.consecutiveSuccesses).toBe(0);
  });

  it('resets confirmation counters after a stale gap', async () => {
    const app = fixture();
    app.fail();
    await app.monitor.check('login');
    await app.monitor.check('login');
    jest.setSystemTime(Date.now() + 30_001);
    expect((await app.monitor.check('login'))?.consecutiveFailures).toBe(1);
    expect(app.sync).not.toHaveBeenCalled();
  });

  it('keeps HTTP latency and probe latency as separate evidence', async () => {
    const app = fixture();
    app.read.mockResolvedValue({ requestRate: 12, errorRate: 0.2, latencyP95Ms: 1800 });
    const result = await app.monitor.check('login');
    expect(result?.evaluation?.probe.latencyP95Ms).toBe(20);
    expect(result?.evaluation?.http?.latencyP95Ms).toBe(1800);
    expect(result?.evaluation?.risk.source).toBe('probe-window-with-http-rate');
  });

  it('does not publish cache changes or incidents when persistence fails', async () => {
    const app = fixture();
    jest.spyOn(app.catalog, 'recordObservation').mockRejectedValue(new Error('database unavailable'));
    await expect(app.monitor.check('login')).rejects.toThrow('database unavailable');
    expect(app.catalog.find('login')?.lastCheckedAt).toBeNull();
    expect(app.sync).not.toHaveBeenCalled();
  });

  it('does not infer recovery of an HTTP incident from a healthy probe without HTTP data', async () => {
    const app = fixture();
    app.read.mockResolvedValue({ requestRate: 12, errorRate: 0.2, latencyP95Ms: 1800 });
    for (let i = 0; i < 3; i++) {
      await app.monitor.check('login');
      jest.setSystemTime(Date.now() + 10_000);
    }
    expect(app.catalog.find('login')?.status).toBe(ServiceStatus.DEGRADED);
    app.read.mockResolvedValue(null);
    for (let i = 0; i < 3; i++) await app.monitor.check('login');
    expect(app.catalog.observed('login').status).toBe('NO_DATA');
    expect(app.catalog.find('login')?.status).toBe(ServiceStatus.DEGRADED);
    expect(app.sync.mock.calls.some((call) => call[1] === ServiceStatus.OPERATIONAL)).toBe(false);
  });
});
