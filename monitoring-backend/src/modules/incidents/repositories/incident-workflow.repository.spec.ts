import type { Incident, Prisma } from '@prisma/client';
import { PrismaService } from '@/common/prisma/prisma.service';
import { IncidentWorkflowRepository } from '@/modules/incidents/repositories/incident-workflow.repository';
import { IncidentAction } from '@/modules/incidents/enums/incident-workflow.enum';

function fixture() {
  let current = { id: 'incident', serviceKey: 'login', version: 1, occurrence: 1, closedAt: null,
    attentionState: 'DETECTED', severity: 'HIGH', assigneeId: null, acknowledgedAt: null } as Incident;
  const events: Array<{ id: string; commandId?: string | null; actorId?: string | null; commandFingerprint?: string | null; version: number }> = [];
  const tx = {
    $queryRaw: jest.fn().mockResolvedValue([{ id: 'service' }]),
    employee: { findFirst: jest.fn(({ where }: { where: { id: string } }) => Promise.resolve(where.id === 'disabled' ? null : { id: where.id })) },
    incident: {
      findUnique: jest.fn(() => Promise.resolve(current)),
      findUniqueOrThrow: jest.fn(() => Promise.resolve(current)),
      update: jest.fn(({ data }: { data: Prisma.IncidentUpdateInput }) => {
        current = { ...current, ...data, version: current.version + 1 } as Incident;
        return Promise.resolve(current);
      }),
    },
    incidentEvent: {
      findUnique: jest.fn(({ where }: { where: { incidentId_commandId: { commandId: string } } }) =>
        Promise.resolve(events.find((event) => event.commandId === where.incidentId_commandId.commandId) ?? null)),
      create: jest.fn(({ data }: { data: Prisma.IncidentEventUncheckedCreateInput }) => {
        const event = { ...data, id: `event-${events.length + 1}` }; events.push(event); return Promise.resolve(event);
      }),
    },
    auditLog: { create: jest.fn().mockResolvedValue({}) },
  };
  const prisma = { ...tx, $transaction: jest.fn((operation: (db: unknown) => Promise<unknown>) => operation(tx)) } as unknown as PrismaService;
  return { repository: new IncidentWorkflowRepository(prisma), events, tx,
    set: (patch: Partial<Incident>) => { current = { ...current, ...patch }; } };
}
const input = { commandId: 'command-1', expectedVersion: 1, reason: 'Investigar afectación', note: 'Revisadas las métricas del servicio.' };

describe('Incident operator commands', () => {
  it('deduplicates a retry with the same actor, payload and command key', async () => {
    const app = fixture();
    const command = { kind: IncidentAction.NOTE as const, input };
    expect((await app.repository.execute('incident', 'operator', command)).replayed).toBe(false);
    expect((await app.repository.execute('incident', 'operator', command)).replayed).toBe(true);
    expect(app.events).toHaveLength(1);
    expect(app.tx.auditLog.create).toHaveBeenCalledTimes(1);
  });
  it('rejects reuse of a command key for different content', async () => {
    const app = fixture();
    await app.repository.execute('incident', 'operator', { kind: IncidentAction.NOTE, input });
    await expect(app.repository.execute('incident', 'operator', { kind: IncidentAction.NOTE, input: { ...input, note: 'Other content' } })).rejects.toThrow();
    expect(app.events).toHaveLength(1);
  });
  it('rejects stale versions before recording changes', async () => {
    const app = fixture(); app.set({ version: 2 });
    await expect(app.repository.execute('incident', 'operator', { kind: IncidentAction.NOTE, input })).rejects.toThrow();
    expect(app.tx.incident.update).not.toHaveBeenCalled();
  });
  it('does not assign a disabled or ineligible owner', async () => {
    const app = fixture();
    await expect(app.repository.execute('incident', 'operator', { kind: IncidentAction.ASSIGN, input: { ...input, assigneeId: 'disabled' } })).rejects.toThrow();
    expect(app.events).toHaveLength(0);
  });
  it('does not accept changes to closed records or from disabled operators', async () => {
    const app = fixture(); app.set({ closedAt: new Date(), attentionState: 'CLOSED' });
    await expect(app.repository.execute('incident', 'operator', { kind: IncidentAction.NOTE, input })).rejects.toThrow();
    app.set({ closedAt: null });
    await expect(app.repository.execute('incident', 'disabled', { kind: IncidentAction.NOTE, input })).rejects.toThrow();
    expect(app.events).toHaveLength(0);
  });
});
