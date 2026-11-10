import { Injectable } from '@nestjs/common';
import type { IncidentEvidence } from '@/modules/incidents/interfaces/incident-evidence.interface';
import { IncidentsRepository } from '@/modules/incidents/repositories/incidents.repository';
import { IncidentWorkflowRepository } from '@/modules/incidents/repositories/incident-workflow.repository';
import { ServiceStatus } from '@/modules/service-state/interfaces/service-state';

@Injectable()
export class IncidentsService {
  constructor(private readonly repository: IncidentsRepository,
    private readonly workflow: IncidentWorkflowRepository) {}

  findAll() { return this.repository.findAll(); }
  detail(id: string) { return this.repository.detail(id); }
  timeline(id: string, beforeVersion?: number) { return this.repository.timeline(id, beforeVersion); }
  assignees() { return this.repository.assignees(); }
  command(...args: Parameters<IncidentWorkflowRepository['execute']>) { return this.workflow.execute(...args); }

  sync(serviceKey: string, status: ServiceStatus, evidence: IncidentEvidence): Promise<void> {
    return this.repository.sync(serviceKey, status, evidence);
  }
}
