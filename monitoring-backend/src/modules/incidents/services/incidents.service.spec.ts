import { PrismaService } from '@/common/prisma/prisma.service';
import { IncidentsRepository } from '@/modules/incidents/repositories/incidents.repository';
import { IncidentsService } from '@/modules/incidents/services/incidents.service';
import { ServiceStatus } from '@/modules/service-state/interfaces/service-state';

describe('IncidentsService', () => {
  it('opens once, escalates once, and records recovery', async () => {
    let incident: { id: string; title: string; severity: string; resolvedAt: Date | null } | null =
      null;
    const alerts: string[] = [];
    const transactionClient = {
      incident: {
        findFirst: jest.fn(() => Promise.resolve(incident?.resolvedAt === null ? incident : null)),
        create: jest.fn(({ data }: { data: { title: string; severity: string } }) => {
          incident = {
            id: 'incident-1',
            title: data.title,
            severity: data.severity,
            resolvedAt: null,
          };
          return Promise.resolve(incident);
        }),
        update: jest.fn(({ data }: { data: { severity?: string; resolvedAt?: Date } }) => {
          if (incident) incident = { ...incident, ...data };
          return Promise.resolve(incident);
        }),
      },
      alert: {
        create: jest.fn(({ data }: { data: { kind: string } }) => {
          alerts.push(data.kind);
          return Promise.resolve();
        }),
      },
    };
    const prisma = {
      ...transactionClient,
      $transaction: jest.fn(
        async (operation: ((tx: unknown) => Promise<void>) | Promise<unknown>[]) => {
          if (Array.isArray(operation)) return Promise.all(operation);
          return operation(transactionClient);
        },
      ),
    };
    const service = new IncidentsService(
      new IncidentsRepository(prisma as unknown as PrismaService),
    );
    const evidence = {
      reasons: ['health failure'],
      anomalyScore: 0,
      observedAt: new Date().toISOString(),
    };

    await service.sync('login', ServiceStatus.DEGRADED, evidence);
    await service.sync('login', ServiceStatus.DEGRADED, evidence);
    await service.sync('login', ServiceStatus.UNAVAILABLE, evidence);
    await service.sync('login', ServiceStatus.UNAVAILABLE, evidence);
    await service.sync('login', ServiceStatus.OPERATIONAL, evidence);

    expect(prisma.incident.create).toHaveBeenCalledTimes(1);
    expect(prisma.incident.update).toHaveBeenCalledTimes(2);
    expect(alerts).toEqual(['OPENED', 'ESCALATED', 'RECOVERY']);
  });
});
