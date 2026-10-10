import { Injectable, Logger } from '@nestjs/common';
import { AiIntegrationService } from '@/modules/ai-integration/ai-integration.service';
import { IncidentsService } from '@/modules/incidents/incidents.service';
import { MonitoredServicesService } from '@/modules/monitored-services/monitored-services.service';

@Injectable()
export class AssistantService {
  private readonly logger = new Logger(AssistantService.name);

  constructor(
    private readonly ai: AiIntegrationService,
    private readonly services: MonitoredServicesService,
    private readonly incidents: IncidentsService,
  ) {}

  async ask(question: string) {
    const asOf = new Date().toISOString();
    const services = this.services.findAll().map((service) => ({
      id: service.id,
      name: service.name,
      status: service.status,
      lastCheckedAt: service.lastCheckedAt,
      latencyMs: service.latencyMs,
    }));
    const incidents = (await this.incidents.findAll()).map((incident) => ({
      id: incident.id,
      serviceId: incident.serviceKey,
      title: incident.title,
      status: incident.status,
    }));
    const evidence = { question, asOf, services, incidents };
    try {
      return await this.ai.answerQuestion(evidence);
    } catch (error) {
      this.logger.warn(
        `Assistant service unavailable: ${error instanceof Error ? error.message : 'unknown error'}`,
      );
      return {
        answer: services.length
          ? `Estado observado: ${services.map((service) => `${service.name}: ${service.status}`).join(', ')}. Datos al ${asOf}.`
          : 'No hay datos disponibles para responder con certeza.',
        provider: 'deterministic',
        asOf,
        evidenceServiceIds: services.map((service) => service.id),
      };
    }
  }
}
