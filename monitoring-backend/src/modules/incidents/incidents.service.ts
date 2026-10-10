import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/database/prisma/prisma.service';
import { ServiceStatus } from '@/modules/service-state/interfaces/service-state';

export interface IncidentEvidence {
  reasons: string[];
  anomalyScore: number;
  observedAt: string;
}

@Injectable()
export class IncidentsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.incident.findMany({ orderBy: { openedAt: 'desc' }, take: 100 });
  }

  async sync(serviceKey: string, status: ServiceStatus, evidence: IncidentEvidence): Promise<void> {
    const active = await this.prisma.incident.findFirst({
      where: { serviceKey, resolvedAt: null },
    });

    if (status === ServiceStatus.OPERATIONAL) {
      if (!active) return;
      await this.prisma.$transaction(async (tx) => {
        await tx.incident.update({
          where: { id: active.id },
          data: {
            status: 'RESOLVED',
            resolvedAt: new Date(),
            lastObservedAt: new Date(evidence.observedAt),
          },
        });
        await tx.alert.create({
          data: { incidentId: active.id, kind: 'RECOVERY', message: `${serviceKey} recovered` },
        });
      });
      return;
    }

    if (status === ServiceStatus.RECOVERING) return;
    const severity = status === ServiceStatus.UNAVAILABLE ? 'HIGH' : 'MEDIUM';
    if (!active) {
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
      return;
    }

    if (active.severity === severity) return;
    await this.prisma.$transaction(async (tx) => {
      await tx.incident.update({
        where: { id: active.id },
        data: {
          severity,
          evidence: { ...evidence },
          lastObservedAt: new Date(evidence.observedAt),
        },
      });
      if (severity === 'HIGH') {
        await tx.alert.create({
          data: { incidentId: active.id, kind: 'ESCALATED', message: `${serviceKey} unavailable` },
        });
      }
    });
  }
}
