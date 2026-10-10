import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { of, throwError } from 'rxjs';
import { AiIntegrationService } from '@/modules/ai-integration/ai-integration.service';
import { DetectionService } from '@/modules/detection/detection.service';
import { IncidentsService } from '@/modules/incidents/incidents.service';
import { MonitoredServicesService } from '@/modules/monitored-services/monitored-services.service';
import { MetricWindowService } from '@/modules/monitoring/metric-window.service';
import { MonitoringService } from '@/modules/monitoring/monitoring.service';
import { PrometheusMetricsService } from '@/modules/monitoring/prometheus-metrics.service';
import { ServiceStateService } from '@/modules/service-state/service-state.service';
import { ServiceStatus } from '@/modules/service-state/interfaces/service-state';

describe('MonitoringService', () => {
  const config = new ConfigService({
    appBackendUrl: 'http://nginx',
    monitor: { timeoutMs: 3000 },
    rules: { maxHealthFailures: 2, latencyThresholdMs: 1000 },
  });

  it('degrades on the first failed check and marks unavailable on the second', async () => {
    const get = jest.fn().mockReturnValue(throwError(() => new Error('timeout')));
    const incidentSync = jest.fn().mockResolvedValue(undefined);
    const monitored = new MonitoredServicesService();
    const monitoring = new MonitoringService(
      { get } as unknown as HttpService,
      config,
      monitored,
      new DetectionService(config),
      new ServiceStateService(),
      new MetricWindowService(),
      { read: jest.fn().mockResolvedValue(null) } as unknown as PrometheusMetricsService,
      { analyzeWindow: jest.fn() } as unknown as AiIntegrationService,
      { sync: incidentSync } as unknown as IncidentsService,
    );

    expect((await monitoring.check('login'))?.status).toBe(ServiceStatus.DEGRADED);
    expect((await monitoring.check('login'))?.status).toBe(ServiceStatus.UNAVAILABLE);
    expect(get).toHaveBeenCalledWith('http://nginx/auth/health', { timeout: 3000 });
    expect(incidentSync).toHaveBeenCalledTimes(2);
  });

  it('continues with rules when the AI service fails', async () => {
    const monitored = new MonitoredServicesService();
    const monitoring = new MonitoringService(
      { get: jest.fn().mockReturnValue(of({ data: {} })) } as unknown as HttpService,
      config,
      monitored,
      new DetectionService(config),
      new ServiceStateService(),
      new MetricWindowService(),
      { read: jest.fn().mockResolvedValue(null) } as unknown as PrometheusMetricsService,
      {
        analyzeWindow: jest.fn().mockRejectedValue(new Error('offline')),
      } as unknown as AiIntegrationService,
      { sync: jest.fn().mockResolvedValue(undefined) } as unknown as IncidentsService,
    );

    await monitoring.check('login');
    await monitoring.check('login');
    expect((await monitoring.check('login'))?.status).toBe(ServiceStatus.OPERATIONAL);
  });
});
