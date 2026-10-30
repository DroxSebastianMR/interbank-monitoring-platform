import { createHash } from 'node:crypto';
import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { AssistantRepository } from '@/modules/assistant/repositories/assistant.repository';
import { deniedAssistantTopic } from '@/modules/assistant/services/assistant-access.policy';
import { redactAssistantContent } from '@/modules/assistant/services/assistant-content-safety';
import {
  buildLocalAssistantAnswer,
  isClearlyUnrelatedQuestion,
  isConversationalIntent,
  isInstanceOutageQuestion,
} from '@/modules/assistant/services/local-assistant-reply';
import { AiIntegrationService } from '@/modules/ai-integration/services/ai-integration.service';
import type {
  AssistantAnswer,
  AssistantEvidence,
} from '@/modules/ai-integration/types/ai-integration.types';
import { IncidentsService } from '@/modules/incidents/services/incidents.service';
import { MonitoredServicesService } from '@/modules/monitored-services/services/monitored-services.service';
import { PrometheusMetricsService } from '@/modules/monitoring/services/prometheus-metrics.service';
import { observedService } from '@/modules/service-state/utils/observed-service';
import { PermissionCode } from '@/modules/auth/enums/permission-code.enum';
import type { EmployeePrincipal } from '@/modules/auth/types/auth.types';

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
    employee: EmployeePrincipal,
    history: AssistantEvidence['history'] = [],
  ): Promise<AssistantAnswer> {
    question = redactAssistantContent(question.trim());
    if (!employee.permissions.includes(PermissionCode.ASSISTANT_ASK)) {
      throw new ForbiddenException('No tienes acceso al asistente');
    }
    const asOf = new Date().toISOString();
    const access = { roles: employee.roles, permissions: employee.permissions };
    const coverage = {
      instanceLevel: false,
      description: 'Hay verificaciones de servicios a través del gateway, pero no telemetría ni incidentes atribuidos a cada instancia de backend.',
    };
    const deniedTopic = deniedAssistantTopic(question, employee);
    if (deniedTopic) {
      return {
        answer: `Con tu acceso actual no puedo mostrar información sobre ${deniedTopic}. Si la necesitas para tu trabajo, solicita el permiso correspondiente.`,
        provider: 'deterministic',
        asOf,
        evidenceServiceIds: [],
      };
    }
    if (isConversationalIntent(question) || isClearlyUnrelatedQuestion(question)) {
      const evidence: AssistantEvidence = {
        question, asOf, access, coverage, services: [], incidents: [], metrics: [], history,
      };
      try {
        return await this.ai.answerQuestion(evidence);
      } catch (error) {
        this.logger.warn(
          `Assistant service unavailable: ${error instanceof Error ? error.message : 'unknown error'}`,
        );
        return buildLocalAssistantAnswer(evidence);
      }
    }
    const canReadServices = employee.permissions.includes(PermissionCode.SERVICES_READ);
    const canReadIncidents = employee.permissions.includes(PermissionCode.INCIDENTS_READ);
    const canReadAnalytics = employee.permissions.includes(PermissionCode.ANALYTICS_READ);
    const services = (canReadServices ? this.services.findAll() : []).map((item) => {
      const service = observedService(item);
      return {
        id: service.id,
        name: service.name,
        status: service.status,
        lastCheckedAt: service.lastCheckedAt,
        latencyMs: service.latencyMs,
      };
    });
    const [incidentRows, metricRows] = await Promise.all([
      canReadIncidents ? this.incidents.findAll() : Promise.resolve([]),
      Promise.all(
        (canReadAnalytics ? services : []).map(async (service) => {
          const value = await this.prometheus.read(service.id);
          // The assistant contract accepts complete traffic observations only.
          return value && value.errorRate !== null && value.latencyP95Ms !== null
            ? { serviceId: service.id, requestRate: value.requestRate, errorRate: value.errorRate, latencyP95Ms: value.latencyP95Ms }
            : null;
        }),
      ),
    ]);
    const incidents = incidentRows.slice(0, 30).map((incident) => ({
      id: incident.id,
      serviceId: incident.serviceKey,
      title: incident.title,
      status: incident.status,
      severity: incident.severity,
      openedAt: incident.openedAt.toISOString(),
      resolvedAt: incident.resolvedAt?.toISOString() ?? null,
      lastObservedAt: incident.lastObservedAt.toISOString(),
    }));
    const metrics = metricRows.filter(
      (value): value is NonNullable<typeof value> => value !== null,
    );
    const evidence: AssistantEvidence = {
      question, asOf, access, coverage, services, incidents, metrics, history,
    };
    if (isInstanceOutageQuestion(question) && !coverage.instanceLevel) {
      return buildLocalAssistantAnswer(evidence);
    }
    try {
      return await this.ai.answerQuestion(evidence);
    } catch (error) {
      this.logger.warn(
        `Assistant service unavailable: ${error instanceof Error ? error.message : 'unknown error'}`,
      );
      return buildLocalAssistantAnswer(evidence);
    }
  }

  createConversation(employeeId: string, title?: string) {
    return this.repository.create(employeeId, redactAssistantContent(title?.trim() || 'Nueva conversación'));
  }

  listConversations(employeeId: string, archived = false) {
    return this.repository.list(employeeId, archived);
  }

  getConversation(id: string, employeeId: string) {
    return this.repository.owned(id, employeeId);
  }

  updateConversation(id: string, employeeId: string, title?: string, archived?: boolean) {
    return this.repository.update(id, employeeId, {
      ...(title !== undefined ? { title: redactAssistantContent(title.trim()) } : {}),
      ...(archived !== undefined ? { archivedAt: archived ? new Date() : null } : {}),
    });
  }

  deleteConversation(id: string, employeeId: string) {
    return this.repository.delete(id, employeeId);
  }

  listMessages(id: string, employeeId: string) {
    return this.repository.messages(id, employeeId);
  }

  async sendMessage(id: string, employee: EmployeePrincipal, content: string) {
    const safeContent = redactAssistantContent(content.trim());
    const conversation = await this.repository.owned(id, employee.id);
    const previous = await this.repository.recentMessagesAfterOwnershipCheck(id);
    const accessFingerprint = createHash('sha256')
      .update(JSON.stringify({
        roles: [...employee.roles].sort(),
        permissions: [...employee.permissions].sort(),
      }))
      .digest('hex');
    // A role downgrade must not feed an earlier privileged answer back to the model.
    const history = previous.filter((message) =>
      message.evidence && typeof message.evidence === 'object' &&
      !Array.isArray(message.evidence) &&
      message.evidence.accessFingerprint === accessFingerprint,
    ).slice(-6).map((message) => ({
      role: message.role === 'assistant' ? ('assistant' as const) : ('user' as const),
      content: message.content.slice(0, 1000),
    }));
    const userMessage = await this.repository.append(
      id, 'user', safeContent, undefined, { accessFingerprint },
    );
    const started = performance.now();
    const answer = await this.ask(safeContent, employee, history);
    const assistantMessage = await this.repository.append(
      id,
      'assistant',
      answer.answer,
      answer.provider,
      {
        asOf: answer.asOf,
        serviceIds: answer.evidenceServiceIds,
        accessFingerprint,
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
      conversation.title === 'Nueva conversación' ? safeContent.slice(0, 100) : undefined,
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
