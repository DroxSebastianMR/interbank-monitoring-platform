import { AiIntegrationService } from '@/modules/ai-integration/services/ai-integration.service';
import { AssistantRepository } from '@/modules/assistant/repositories/assistant.repository';
import { AssistantService } from '@/modules/assistant/services/assistant.service';
import { IncidentsService } from '@/modules/incidents/services/incidents.service';
import { MonitoredServicesService } from '@/modules/monitored-services/services/monitored-services.service';
import { PrometheusMetricsService } from '@/modules/monitoring/services/prometheus-metrics.service';

describe('AssistantService', () => {
  it('rejects unrelated questions even when the Python service is unavailable', async () => {
    const service = new AssistantService(
      {
        answerQuestion: jest.fn().mockRejectedValue(new Error('offline')),
      } as unknown as AiIntegrationService,
      {
        findAll: () => [
          {
            id: 'login',
            name: 'Login',
            status: 'OPERATIONAL',
            lastCheckedAt: null,
            latencyMs: null,
          },
        ],
      } as unknown as MonitoredServicesService,
      { findAll: () => Promise.resolve([]) } as unknown as IncidentsService,
      {} as AssistantRepository,
      { read: () => Promise.resolve(null) } as unknown as PrometheusMetricsService,
    );

    const answer = await service.ask('¿Cuál es la capital de Francia?');

    expect(answer.provider).toBe('deterministic');
    expect(answer.answer).toContain('Solo puedo ayudarte');
    expect(answer.evidenceServiceIds).toEqual([]);
  });

  it('sends only bounded operational evidence to AI', async () => {
    const ai = {
      answerQuestion: jest.fn().mockResolvedValue({
        answer: 'Degradado',
        provider: 'deterministic',
        asOf: '2026-10-14T10:00:00Z',
        evidenceServiceIds: ['login'],
      }),
    };
    const services = {
      findAll: jest
        .fn()
        .mockReturnValue([
          { id: 'login', name: 'Login', status: 'DEGRADED', lastCheckedAt: null, latencyMs: 800 },
        ]),
    };
    const incidents = { findAll: jest.fn().mockResolvedValue([]) };
    const prometheus = {
      read: jest.fn().mockResolvedValue({ requestRate: 8, errorRate: 0.2, latencyP95Ms: 900 }),
    };
    const service = new AssistantService(
      ai as unknown as AiIntegrationService,
      services as unknown as MonitoredServicesService,
      incidents as unknown as IncidentsService,
      {} as AssistantRepository,
      prometheus as unknown as PrometheusMetricsService,
    );

    await service.ask('¿Cómo está login?');

    expect(ai.answerQuestion).toHaveBeenCalledWith(
      expect.objectContaining({
        question: '¿Cómo está login?',
        metrics: [{ serviceId: 'login', requestRate: 8, errorRate: 0.2, latencyP95Ms: 900 }],
        services: [expect.objectContaining({ id: 'login', status: 'DEGRADED' })],
      }),
    );
  });

  it('persists a user message, answer and run for an owned conversation', async () => {
    const ai = {
      answerQuestion: jest.fn().mockResolvedValue({
        answer: 'Login operativo',
        provider: 'deterministic',
        asOf: '2026-10-14T10:00:00Z',
        evidenceServiceIds: ['login'],
      }),
    };
    const repository = {
      owned: jest.fn().mockResolvedValue({ id: 'conversation-1', title: 'Nueva conversación' }),
      recentMessagesAfterOwnershipCheck: jest.fn().mockResolvedValue([]),
      append: jest
        .fn()
        .mockImplementation((_id: string, role: string, content: string) =>
          Promise.resolve({ id: `${role}-1`, role, content }),
        ),
      finishConversation: jest.fn().mockResolvedValue(undefined),
      createRun: jest.fn().mockResolvedValue(undefined),
    };
    const service = new AssistantService(
      ai as unknown as AiIntegrationService,
      { findAll: () => [] } as unknown as MonitoredServicesService,
      { findAll: () => Promise.resolve([]) } as unknown as IncidentsService,
      repository as unknown as AssistantRepository,
      { read: () => Promise.resolve(null) } as unknown as PrometheusMetricsService,
    );

    const result = await service.sendMessage('conversation-1', 'employee-1', '¿Cómo está login?');

    expect(repository.owned).toHaveBeenCalledWith('conversation-1', 'employee-1');
    expect(repository.append).toHaveBeenCalledTimes(2);
    expect(repository.createRun).toHaveBeenCalledWith(
      expect.objectContaining({
        messageId: 'assistant-1',
        provider: 'deterministic',
        status: 'FALLBACK',
      }),
    );
    expect(result.assistantMessage.content).toBe('Login operativo');
  });
});
