import { Injectable } from '@nestjs/common';
import type { IncidentEvidence } from '@/modules/incidents/interfaces/incident-evidence.interface';
import { IncidentsRepository } from '@/modules/incidents/repositories/incidents.repository';
import { ServiceStatus } from '@/modules/service-state/interfaces/service-state';

@Injectable()
export class IncidentsService {
  constructor(private readonly repository: IncidentsRepository) {}

  findAll() {
    return this.repository.findAll();
  }

  async sync(serviceKey: string, status: ServiceStatus, evidence: IncidentEvidence): Promise<void> {
    const active = await this.repository.findActive(serviceKey);

    if (status === ServiceStatus.OPERATIONAL) {
      if (!active) return;
      await this.repository.resolve(active.id, serviceKey, evidence.observedAt);
      return;
    }

    if (status === ServiceStatus.RECOVERING) return;
    const severity = status === ServiceStatus.UNAVAILABLE ? 'HIGH' : 'MEDIUM';
    if (!active) {
      await this.repository.open(serviceKey, status, severity, evidence);
      return;
    }

    if (active.severity === severity) return;
    await this.repository.changeSeverity(active.id, serviceKey, severity, evidence);
  }
}
