import type { Incident, Prisma } from '@prisma/client';
import { PrismaService } from '@/common/prisma/prisma.service';
import { IncidentsRepository } from '@/modules/incidents/repositories/incidents.repository';
import { ServiceStatus } from '@/modules/service-state/interfaces/service-state';

function fixture() {
  let tick = Date.now();
  jest.useFakeTimers();
  jest.setSystemTime(tick);
  const records: Incident[] = [];
  const journal: Array<{ kind: string; incidentId: string; version: number }> = [];
  let source = { id: 'service', code: 'login', criticality: 'HIGH', status: ServiceStatus.DEGRADED, monitoringEnabled: true, lastCheckedAt: new Date(tick) };
  const tx = {
    $queryRaw: jest.fn().mockResolvedValue([{ id: 'service' }]),
    monitoredService: { findUniqueOrThrow: jest.fn(() => Promise.resolve(source)) },
    incident: {
      findFirst: jest.fn(({ where }: { where: { closedAt: unknown } }) => Promise.resolve(
        [...records].reverse().find((row) => where.closedAt === null ? row.closedAt === null : row.closedAt !== null) ?? null)),
      create: jest.fn(({ data }: { data: Prisma.IncidentUncheckedCreateInput }) => {
        const row = { ...data, version: 1, occurrence: 1, closedAt: null, resolvedAt: null,
          attentionState: 'DETECTED', severityOverride: false, acknowledgedAt: null } as Incident;
        records.push(row); return Promise.resolve(row);
      }),
      update: jest.fn(({ where, data }: { where: { id: string }; data: Prisma.IncidentUpdateInput }) => {
        const index = records.findIndex((row) => row.id === where.id);
        const old = records[index];
        const updated = { ...old, ...data,
          version: typeof data.version === 'object' ? old.version + 1 : old.version,
          occurrence: typeof data.occurrence === 'object' ? old.occurrence + 1 : old.occurrence,
        } as Incident;
        records[index] = updated; return Promise.resolve(updated);
      }),
    },
    incidentEvent: { create: jest.fn(({ data }: { data: Prisma.IncidentEventUncheckedCreateInput }) => {
      journal.push({ kind: data.kind, incidentId: data.incidentId, version: data.version }); return Promise.resolve(data);
    }) },
    alert: { create: jest.fn().mockResolvedValue({}) },
  };
  const prisma = { ...tx, $transaction: jest.fn((operation: (db: unknown) => Promise<unknown>) => operation(tx)) } as unknown as PrismaService;
  const repository = new IncidentsRepository(prisma);
  const observe = async (status: ServiceStatus) => {
    source = { ...source, status, lastCheckedAt: new Date(tick += 1000) };
    jest.setSystemTime(tick);
    await repository.sync('login', status, { reasons: ['technical observation'], anomalyScore: 0, observedAt: source.lastCheckedAt.toISOString() });
  };
  return { records, journal, observe };
}

afterEach(() => jest.useRealTimers());

describe('Incident technical lifecycle', () => {
  it('reuses a resolved but unclosed file when an affectation reappears', async () => {
    const app = fixture();
    await app.observe(ServiceStatus.UNAVAILABLE);
    const id = app.records[0].id;
    await app.observe(ServiceStatus.RECOVERING);
    await app.observe(ServiceStatus.OPERATIONAL);
    expect(app.records[0].attentionState).toBe('RESOLVED');
    await app.observe(ServiceStatus.UNAVAILABLE);
    expect(app.records).toHaveLength(1);
    expect(app.records[0]).toMatchObject({ id, occurrence: 2, attentionState: 'INVESTIGATING', resolvedAt: null });
    expect(app.journal.map((event) => event.kind)).toEqual(['DETECTED', 'RECOVERY_STARTED', 'RECOVERED', 'REOPENED']);
  });
  it('links a new incident to a previously closed record', async () => {
    const app = fixture();
    await app.observe(ServiceStatus.DEGRADED);
    await app.observe(ServiceStatus.OPERATIONAL);
    const previous = app.records[0].id;
    // Fixture represents a closure already accepted by the operator workflow.
    app.records[0].closedAt = new Date(); app.records[0].attentionState = 'CLOSED';
    await app.observe(ServiceStatus.UNAVAILABLE);
    expect(app.records).toHaveLength(2);
    expect(app.records[1].previousIncidentId).toBe(previous);
  });
  it('does not churn operator versions on unchanged observations', async () => {
    const app = fixture();
    await app.observe(ServiceStatus.UNAVAILABLE);
    await app.observe(ServiceStatus.UNAVAILABLE);
    expect(app.records[0].version).toBe(1);
    expect(app.journal).toHaveLength(1);
    await app.observe(ServiceStatus.DEGRADED);
    expect(app.records[0].version).toBe(2);
  });
});
