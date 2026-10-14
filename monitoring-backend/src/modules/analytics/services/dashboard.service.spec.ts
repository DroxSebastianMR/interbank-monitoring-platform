import { ConfigService } from '@nestjs/config';

import { DashboardRepository } from '@/modules/analytics/repositories/dashboard.repository';
import { DashboardService } from '@/modules/analytics/services/dashboard.service';
import { MonitoredServicesService } from '@/modules/monitored-services/services/monitored-services.service';
import { ServiceStatus } from '@/modules/service-state/interfaces/service-state';

describe('DashboardService', () => {
  const config = new ConfigService({ app: { env: 'test' } });

  it('reports NO_DATA and null metrics before the first observation', async () => {
    const repository = {
      snapshot: jest.fn().mockResolvedValue({
        checks: [],
        incidents: [],
        alerts: [],
        activeIncidentsCount: 0,
        activeAlertsCount: 0,
      }),
    } as unknown as DashboardRepository;
    const service = new DashboardService(repository, new MonitoredServicesService(), config);
    const overview = await service.overview();
    expect(overview.overallStatus).toBe('NO_DATA');
    expect(overview.noDataCount).toBe(3);
    expect(overview.availability).toBeNull();
    expect(overview.latencyP95Ms).toBeNull();
    expect(overview.errorRate).toBeNull();
  });

  it('counts actual active records and recent observations', async () => {
    const now = new Date();
    const repository = {
      snapshot: jest.fn().mockResolvedValue({
        checks: [
          {
            status: 'OPERATIONAL',
            latencyMs: 25,
            reachable: true,
            checkedAt: now,
            service: { code: 'login' },
          },
        ],
        incidents: [],
        alerts: [],
        activeIncidentsCount: 2,
        activeAlertsCount: 3,
      }),
    } as unknown as DashboardRepository;
    const services = new MonitoredServicesService();
    services.update('login', {
      status: ServiceStatus.OPERATIONAL,
      lastCheckedAt: now.toISOString(),
      latencyMs: 25,
    });
    const overview = await new DashboardService(repository, services, config).overview();
    expect(overview.operationalCount).toBe(1);
    expect(overview.noDataCount).toBe(2);
    expect(overview.activeIncidentsCount).toBe(2);
    expect(overview.activeAlertsCount).toBe(3);
    expect(overview.availability).toBe(1);
  });

  it('marks old observations as stale rather than treating them as current availability', async () => {
    const old = new Date(Date.now() - 61_000);
    const repository = {
      snapshot: jest.fn().mockResolvedValue({
        checks: [],
        incidents: [],
        alerts: [],
        activeIncidentsCount: 0,
        activeAlertsCount: 0,
      }),
    } as unknown as DashboardRepository;
    const services = new MonitoredServicesService();
    services.update('login', {
      status: ServiceStatus.OPERATIONAL,
      lastCheckedAt: old.toISOString(),
    });
    const overview = await new DashboardService(repository, services, config).overview();
    expect(overview.services.find((item) => item.id === 'login')?.status).toBe('NO_DATA');
    expect(overview.dataFreshness).toBe('STALE');
    expect(overview.overallStatus).toBe('NO_DATA');
  });
});
