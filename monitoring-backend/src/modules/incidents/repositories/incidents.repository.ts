import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import type { IncidentEvidence } from '@/modules/incidents/interfaces/incident-evidence.interface';
import type { ServiceStatus } from '@/modules/service-state/interfaces/service-state';

type IncidentSeverity = 'HIGH' | 'MEDIUM';

@Injectable()
export class IncidentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.incident.findMany({ orderBy: { openedAt: 'desc' }, take: 100 });
  }

  findActive(serviceKey: string) {
    return this.prisma.incident.findFirst({ where: { serviceKey, resolvedAt: null } });
  }

  async resolve(incidentId: string, serviceKey: string, observedAt: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.incident.update({
        where: { id: incidentId },
        data: {
          status: 'RESOLVED',
          resolvedAt: new Date(),
          lastObservedAt: new Date(observedAt),
        },
      });
      await tx.alert.create({
        data: { incidentId, kind: 'RECOVERY', message: `${serviceKey} recovered` },
      });
    });
  }

  async open(
    serviceKey: string,
    status: ServiceStatus,
    severity: IncidentSeverity,
    evidence: IncidentEvidence,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const incident = await tx.incident.create({
        data: {
          serviceKey,
          title: `${serviceKey} ${status.toLowerCase()}`,
          status: 'OPEN',
          severity,
          evidence: { ...evidence },
          lastObservedAt: new Date(evidence.observedAt),
        },
      });
      await tx.alert.create({
        data: { incidentId: incident.id, kind: 'OPENED', message: incident.title },
      });
    });
  }

  async changeSeverity(
    incidentId: string,
    serviceKey: string,
    severity: IncidentSeverity,
    evidence: IncidentEvidence,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.incident.update({
        where: { id: incidentId },
        data: {
          severity,
          evidence: { ...evidence },
          lastObservedAt: new Date(evidence.observedAt),
        },
      });
      if (severity === 'HIGH') {
        await tx.alert.create({
          data: { incidentId, kind: 'ESCALATED', message: `${serviceKey} unavailable` },
        });
      }
    });
  }
}
