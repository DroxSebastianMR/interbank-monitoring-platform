import { createHash } from 'node:crypto';
import { AiIntegrationService } from '@/modules/ai-integration/services/ai-integration.service';
import { AssistantRepository } from '@/modules/assistant/repositories/assistant.repository';
import { AssistantService } from '@/modules/assistant/services/assistant.service';
import { PermissionCode } from '@/modules/auth/enums/permission-code.enum';
import type { EmployeePrincipal } from '@/modules/auth/types/auth.types';
import { IncidentsService } from '@/modules/incidents/services/incidents.service';
import { MonitoredServicesService } from '@/modules/monitored-services/services/monitored-services.service';
import { PrometheusMetricsService } from '@/modules/monitoring/services/prometheus-metrics.service';

const viewer: EmployeePrincipal = {
  id: 'employee-1', employeeCode: 'TEST1', corporateEmail: 'test@example.invalid',
  firstName: 'Test', lastName: 'Viewer', jobTitle: null, department: null,
  sessionId: 'session-1', roles: ['VIEWER'],
  permissions: [PermissionCode.ASSISTANT_ASK, PermissionCode.SERVICES_READ,
    PermissionCode.INCIDENTS_READ, PermissionCode.ANALYTICS_READ],
};

function offlineAssistantService() {
  return new AssistantService(
    {
      answerQuestion: jest.fn().mockRejectedValue(new Error('offline')),
    } as unknown as AiIntegrationService,
    {
      findAll: () => [
        { id: 'login', name: 'Login', status: 'OPERATIONAL', lastCheckedAt: null, latencyMs: null },
      ],
    } as unknown as MonitoredServicesService,
    { findAll: () => Promise.resolve([]) } as unknown as IncidentsService,
    {} as AssistantRepository,
    { read: () => Promise.resolve(null) } as unknown as PrometheusMetricsService,
  );
}

describe('AssistantService', () => {
  it('rejects unrelated questions even when the Python service is unavailable', async () => {
    const service = offlineAssistantService();

    const answer = await service.ask('¿Cuál es la capital de Francia?', viewer);

    expect(answer.provider).toBe('deterministic');
    expect(answer.answer).toContain('fuera de mi función');
    expect(answer.evidenceServiceIds).toEqual([]);
  });

  it('sends greetings and scope questions to AI without inspecting services', async () => {
    const ai = { answerQuestion: jest.fn().mockResolvedValue({
      answer: '¡Buenas noches! ¿Revisamos el monitor?',
      provider: 'openrouter',
      asOf: '2026-10-14T10:00:00Z',
      evidenceServiceIds: [],
    }) };
    const services = { findAll: jest.fn() };
    const service = new AssistantService(
      ai as unknown as AiIntegrationService,
      services as unknown as MonitoredServicesService,
      {} as IncidentsService,
      {} as AssistantRepository,
      {} as PrometheusMetricsService,
    );
    const answer = await service.ask('Holaa buenass', viewer);

    expect(answer.provider).toBe('openrouter');
    expect(answer.evidenceServiceIds).toEqual([]);
    expect(services.findAll).not.toHaveBeenCalled();
    expect(ai.answerQuestion).toHaveBeenCalledWith(expect.objectContaining({
      question: 'Holaa buenass', access: { roles: ['VIEWER'], permissions: viewer.permissions },
      services: [], incidents: [], metrics: [],
    }));
    await service.ask('No me puedes hablar de otro tema?', viewer);
    expect(ai.answerQuestion).toHaveBeenCalledTimes(2);
  });

  it('uses a friendly local answer for greetings if AI is unavailable', async () => {
    const answer = await offlineAssistantService().ask('Hola buenas noches', viewer);

    expect(answer.provider).toBe('deterministic');
    expect(answer.answer).toContain('¡Hola!');
    expect(answer.evidenceServiceIds).toEqual([]);
  });

  it('answers a natural question about the employee own role without requiring admin access', async () => {
    const answer = await offlineAssistantService().ask('¿Qué rol tengo actualmente en el sistema?', viewer);

    expect(answer.answer).toContain('VIEWER');
    expect(answer.answer).not.toContain('fuera de mi función');
    expect(answer.evidenceServiceIds).toEqual([]);
  });

  it('does not present service incidents as proven backend instance outages', async () => {
    const service = new AssistantService(
      { answerQuestion: jest.fn().mockRejectedValue(new Error('offline')) } as unknown as AiIntegrationService,
      { findAll: () => [{ id: 'login', name: 'Login', status: 'OPERATIONAL', lastCheckedAt: null, latencyMs: null }] } as unknown as MonitoredServicesService,
      { findAll: () => Promise.resolve([{
        id: 'incident-1', serviceKey: 'login', title: 'login unavailable',
        status: 'RESOLVED', severity: 'HIGH',
        openedAt: new Date('2026-10-14T10:00:00Z'),
        resolvedAt: new Date('2026-10-14T10:05:00Z'),
        lastObservedAt: new Date('2026-10-14T10:05:00Z'),
      }]) } as unknown as IncidentsService,
      {} as AssistantRepository,
      { read: () => Promise.resolve(null) } as unknown as PrometheusMetricsService,
    );

    const answer = await service.ask('Informe de la última caída de las instancias del backend', viewer);

    expect(answer.answer).toContain('No puedo confirmar');
    expect(answer.answer).toContain('login');
    expect(answer.answer).toContain('14/10/2026');
    expect(answer.answer).toContain('no prueba qué instancia falló');
  });

  it('provides a system summary when asked how the system is doing', async () => {
    const answer = await offlineAssistantService().ask(
      'Dame un resumen de cómo va el sistema actualmente',
      viewer,
    );

    expect(answer.answer).toContain('Login: OPERATIONAL');
    expect(answer.evidenceServiceIds).toEqual(['login']);
  });

  it('interprets este sistema as this monitor in a local fallback', async () => {
    const answer = await offlineAssistantService().ask('Explícame cómo va este sistema', viewer);

    expect(answer.answer).toContain('Login: OPERATIONAL');
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

    await service.ask('¿Cómo está login?', viewer);

    expect(ai.answerQuestion).toHaveBeenCalledWith(
      expect.objectContaining({
        question: '¿Cómo está login?',
        metrics: [{ serviceId: 'login', requestRate: 8, errorRate: 0.2, latencyP95Ms: 900 }],
        services: [expect.objectContaining({ id: 'login', status: 'DEGRADED' })],
      }),
    );
  });

  it('persists a user message, answer and run for an owned conversation', async () => {
    const oldRoleFingerprint = createHash('sha256').update(JSON.stringify({
      roles: ['ADMINISTRATOR'],
      permissions: [...viewer.permissions].sort(),
    })).digest('hex');
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
      recentMessagesAfterOwnershipCheck: jest.fn().mockResolvedValue([
        { role: 'assistant', content: 'privileged old answer', evidence: { accessFingerprint: oldRoleFingerprint } },
      ]),
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

    const result = await service.sendMessage('conversation-1', viewer, '¿Cómo está login?');

    expect(repository.owned).toHaveBeenCalledWith('conversation-1', 'employee-1');
    expect(repository.append).toHaveBeenCalledTimes(2);
    expect(ai.answerQuestion).toHaveBeenCalledWith(expect.objectContaining({ history: [] }));
    expect(repository.createRun).toHaveBeenCalledWith(
      expect.objectContaining({
        messageId: 'assistant-1',
        provider: 'deterministic',
        status: 'FALLBACK',
      }),
    );
    expect(result.assistantMessage.content).toBe('Login operativo');
  });

  it('denies administration details to a viewer before reading evidence or calling AI', async () => {
    const ai = { answerQuestion: jest.fn() };
    const services = { findAll: jest.fn() };
    const service = new AssistantService(
      ai as unknown as AiIntegrationService,
      services as unknown as MonitoredServicesService,
      {} as IncidentsService,
      {} as AssistantRepository,
      {} as PrometheusMetricsService,
    );

    const answer = await service.ask('Muéstrame los roles de administradores', viewer);

    expect(answer.provider).toBe('deterministic');
    expect(answer.answer).toContain('no puedo mostrar');
    expect(services.findAll).not.toHaveBeenCalled();
    expect(ai.answerQuestion).not.toHaveBeenCalled();
    const mixed = await service.ask('Mis permisos de administradores', viewer);
    expect(mixed.answer).toContain('no puedo mostrar');
  });

  it('requires assistant.ask even when called outside the controller', async () => {
    await expect(offlineAssistantService().ask('Hola', {
      ...viewer, permissions: [PermissionCode.SERVICES_READ],
    })).rejects.toThrow('No tienes acceso al asistente');
  });

  it('does not send metrics without analytics.read even when assistant.ask is granted', async () => {
    const ai = { answerQuestion: jest.fn().mockResolvedValue({ answer: 'Listo', provider: 'openrouter', evidenceServiceIds: [] }) };
    const prometheus = { read: jest.fn() };
    const service = new AssistantService(
      ai as unknown as AiIntegrationService,
      { findAll: () => [{ id: 'login', name: 'Login', status: 'OK', lastCheckedAt: null, latencyMs: null }] } as unknown as MonitoredServicesService,
      { findAll: () => Promise.resolve([]) } as unknown as IncidentsService,
      {} as AssistantRepository,
      prometheus as unknown as PrometheusMetricsService,
    );

    await service.ask('¿Cómo está login?', {
      ...viewer, permissions: [PermissionCode.ASSISTANT_ASK, PermissionCode.SERVICES_READ],
    });

    expect(prometheus.read).not.toHaveBeenCalled();
    expect(ai.answerQuestion).toHaveBeenCalledWith(expect.objectContaining({ metrics: [] }));
  });
});
