import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { of, throwError } from 'rxjs';

import { AI_ASSISTANT_TIMEOUT_MS } from '@/modules/ai-integration/constants/ai-integration.constants';
import { AiIntegrationService } from '@/modules/ai-integration/services/ai-integration.service';
import type { AssistantEvidence } from '@/modules/ai-integration/types/ai-integration.types';
import type { MetricWindow } from '@/modules/monitoring/interfaces/metric-window.interface';

describe('AiIntegrationService', () => {
  const config = new ConfigService({ integrations: { aiServiceUrl: 'http://ai:8000' } });

  it('calls the typed health and prediction routes', async () => {
    const get = jest
      .fn()
      .mockReturnValue(
        of({ data: { status: 'ok', service: 'monitoring-ai', timestamp: '2026-10-10T00:00:00Z' } }),
      );
    const post = jest.fn().mockReturnValue(
      of({
        data: { anomaly: false, anomalyScore: 0.1, riskLevel: 'LOW', modelMode: 'baseline' },
      }),
    );
    const service = new AiIntegrationService({ get, post } as unknown as HttpService, config);
    const prediction = { latency: 20, errorRate: 0, timeoutRate: 0, requestRate: 1 };

    await expect(service.health()).resolves.toMatchObject({ service: 'monitoring-ai' });
    await expect(service.predict(prediction)).resolves.toMatchObject({ riskLevel: 'LOW' });
    expect(get).toHaveBeenCalledWith('http://ai:8000/health');
    expect(post).toHaveBeenCalledWith('http://ai:8000/predict', prediction);
  });

  it('sends a monitoring window and assistant evidence to separate routes', async () => {
    const window: MetricWindow = {
      serviceId: 'login',
      windowStart: '2026-10-10T00:00:00Z',
      windowEnd: '2026-10-10T00:01:00Z',
      sampleCount: 3,
      latencyP95Ms: 20,
      errorRate: 0,
      timeoutRate: 0,
      requestRate: 1,
      availability: 1,
    };
    const evidence: AssistantEvidence = {
      question: '¿Cómo va el login?',
      asOf: '2026-10-10T00:01:00Z',
      services: [],
      incidents: [],
    };
    const post = jest
      .fn()
      .mockReturnValueOnce(of({ data: { serviceId: 'login', status: 'OK', anomalyScore: 0.1 } }))
      .mockReturnValueOnce(of({ data: { answer: 'Operativo', provider: 'deterministic' } }));
    const service = new AiIntegrationService({ post } as unknown as HttpService, config);

    await service.analyzeWindow(window);
    await service.answerQuestion(evidence);

    expect(post).toHaveBeenNthCalledWith(1, 'http://ai:8000/v1/anomalies/analyze', window);
    expect(post).toHaveBeenNthCalledWith(2, 'http://ai:8000/v1/assistant/answer', evidence, {
      timeout: AI_ASSISTANT_TIMEOUT_MS,
    });
  });

  it('propagates an unavailable AI error so the monitoring rules can provide the fallback', async () => {
    const post = jest.fn().mockReturnValue(throwError(() => new Error('offline')));
    const service = new AiIntegrationService({ post } as unknown as HttpService, config);
    await expect(
      service.predict({ latency: 20, errorRate: 0, timeoutRate: 0, requestRate: 1 }),
    ).rejects.toThrow('offline');
  });
});
