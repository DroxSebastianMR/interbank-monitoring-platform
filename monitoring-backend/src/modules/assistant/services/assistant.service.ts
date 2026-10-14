import { Injectable, Logger } from '@nestjs/common';
import { AssistantRepository } from '@/modules/assistant/repositories/assistant.repository';
import { AiIntegrationService } from '@/modules/ai-integration/services/ai-integration.service';
import type {
  AssistantAnswer,
  AssistantEvidence,
} from '@/modules/ai-integration/types/ai-integration.types';
import { IncidentsService } from '@/modules/incidents/services/incidents.service';
import { MonitoredServicesService } from '@/modules/monitored-services/services/monitored-services.service';
import { PrometheusMetricsService } from '@/modules/monitoring/services/prometheus-metrics.service';

@Injectable()
export class AssistantService {
  private readonly logger = new Logger(AssistantService.name);

  constructor(
    private readonly ai: AiIntegrationService,
    private readonly services: MonitoredServicesService,
    private readonly incidents: IncidentsService,
    private readonly repository: AssistantRepository,
    private readonly prometheus: PrometheusMetricsService,
  ) {}

  async ask(
    question: string,
    history: AssistantEvidence['history'] = [],
  ): Promise<AssistantAnswer> {
    const asOf = new Date().toISOString();
    const services = this.services.findAll().map((service) => ({
      id: service.id,
      name: service.name,
      status: service.status,
      lastCheckedAt: service.lastCheckedAt,
      latencyMs: service.latencyMs,
    }));
    const [incidentRows, metricRows] = await Promise.all([
      this.incidents.findAll(),
      Promise.all(
        services.map(async (service) => {
          const value = await this.prometheus.read(service.id);
          return value ? { serviceId: service.id, ...value } : null;
        }),
      ),
    ]);
    const incidents = incidentRows.slice(0, 30).map((incident) => ({
      id: incident.id,
      serviceId: incident.serviceKey,
      title: incident.title,
      status: incident.status,
    }));
    const metrics = metricRows.filter(
      (value): value is NonNullable<typeof value> => value !== null,
    );
    const evidence: AssistantEvidence = { question, asOf, services, incidents, metrics, history };
    try {
      return await this.ai.answerQuestion(evidence);
    } catch (error) {
      this.logger.warn(
        `Assistant service unavailable: ${error instanceof Error ? error.message : 'unknown error'}`,
      );
      const inScope =
        /monitor|servicio|servidor|backend|nginx|redis|prometheus|latencia|incidente|alerta|ca[ií]da|disponibilidad|transferencia|login|balance|cpu|memoria|base de datos|transacci[oó]n|salud|m[eé]trica|riesgo|anomal[ií]a/i.test(
          question,
        );
      return {
        answer: !inScope
          ? 'Solo puedo ayudarte con el estado, las métricas y los incidentes del sistema de monitoreo de este proyecto.'
          : services.length
            ? `Estado observado: ${services.map((service) => `${service.name}: ${service.status}`).join(', ')}. Datos al ${asOf}.`
            : 'No hay datos disponibles para responder con certeza.',
        provider: 'deterministic',
        asOf,
        evidenceServiceIds: inScope ? services.map((service) => service.id) : [],
      };
    }
  }

  createConversation(employeeId: string, title?: string) {
    return this.repository.create(employeeId, title?.trim() || 'Nueva conversación');
  }

  listConversations(employeeId: string, archived = false) {
    return this.repository.list(employeeId, archived);
  }

  getConversation(id: string, employeeId: string) {
    return this.repository.owned(id, employeeId);
  }

  updateConversation(id: string, employeeId: string, title?: string, archived?: boolean) {
    return this.repository.update(id, employeeId, {
      ...(title !== undefined ? { title: title.trim() } : {}),
      ...(archived !== undefined ? { archivedAt: archived ? new Date() : null } : {}),
    });
  }

  deleteConversation(id: string, employeeId: string) {
    return this.repository.delete(id, employeeId);
  }

  listMessages(id: string, employeeId: string) {
    return this.repository.messages(id, employeeId);
  }

  async sendMessage(id: string, employeeId: string, content: string) {
    const conversation = await this.repository.owned(id, employeeId);
    const previous = await this.repository.recentMessagesAfterOwnershipCheck(id);
    const history = previous.slice(-6).map((message) => ({
      role: message.role === 'assistant' ? ('assistant' as const) : ('user' as const),
      content: message.content.slice(0, 1000),
    }));
    const userMessage = await this.repository.append(id, 'user', content.trim());
    const started = performance.now();
    const answer = await this.ask(content.trim(), history);
    const assistantMessage = await this.repository.append(
      id,
      'assistant',
      answer.answer,
      answer.provider,
      {
        asOf: answer.asOf,
        serviceIds: answer.evidenceServiceIds,
      },
    );
    const run = await this.repository.createRun({
      messageId: assistantMessage.id,
      provider: answer.provider,
      model: answer.model ?? undefined,
      status: answer.provider === 'deterministic' ? 'FALLBACK' : 'COMPLETED',
      latencyMs: Math.round(performance.now() - started),
      promptTokens: answer.promptTokens ?? undefined,
      completionTokens: answer.completionTokens ?? undefined,
    });
    await this.repository.finishConversation(
      id,
      conversation.title === 'Nueva conversación' ? content.trim().slice(0, 100) : undefined,
    );
    return { userMessage, assistantMessage, answer, run };
  }

  feedback(messageId: string, employeeId: string, value: 'HELPFUL' | 'NOT_HELPFUL') {
    return this.repository.feedback(messageId, employeeId, value);
  }

  getRun(id: string, employeeId: string) {
    return this.repository.run(id, employeeId);
  }
}
