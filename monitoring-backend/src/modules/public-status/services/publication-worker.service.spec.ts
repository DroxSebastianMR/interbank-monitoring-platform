import { ConfigService } from '@nestjs/config';
import type { StatusPublication } from '@prisma/client';
import { PrismaService } from '@/common/prisma/prisma.service';
import { PublicationWorker } from '@/modules/public-status/services/publication-worker.service';
import { PublicStatusRepository } from '@/modules/public-status/repositories/public-status.repository';

function fixture(visible = false) {
  const now = new Date();
  const job = { id: 'notice', serviceKey: 'login', sequence: 1, sourceServiceVersion: 1,
    sourceTechnicalStatus: 'OPERATIONAL', kind: visible ? 'RECOVERY' : 'SNAPSHOT',
    state: visible ? 'PUBLISHED' : 'PENDING', visibleAt: null, expiresAt: null,
    incidentId: visible ? 'incident' : null, occurrence: visible ? 1 : null, attempts: 0 } as StatusPublication;
  const source = { code: 'login', status: 'OPERATIONAL', version: 1, monitoringEnabled: true,
    lastCheckedAt: now, lastLatencyMs: 20, consecutiveFailures: 0, evaluation: null };
  const tx = {
    $queryRaw: jest.fn().mockResolvedValue([{ id: 'service' }]),
    monitoredService: { findMany: jest.fn().mockResolvedValue([]), findUniqueOrThrow: jest.fn().mockResolvedValue(source) },
    publicServiceStatus: { findMany: jest.fn().mockResolvedValue([]), findUniqueOrThrow: jest.fn().mockResolvedValue({ nextSequence: 2, publishedSequence: 0 }), update: jest.fn() },
    incident: { findMany: jest.fn().mockResolvedValue([]), findUniqueOrThrow: jest.fn().mockResolvedValue({ id: 'incident', occurrence: 1, resolvedAt: now, closedAt: null }), update: jest.fn() },
    incidentEvent: { create: jest.fn() },
    statusPublication: {
      findMany: jest.fn(({ where }: { where: { state: string } }) => Promise.resolve(where.state === job.state ? [job] : [])),
      findUniqueOrThrow: jest.fn().mockResolvedValue(job), update: jest.fn().mockResolvedValue({}),
    },
  };
  const prisma = { ...tx, $transaction: jest.fn((operation: (db: unknown) => Promise<unknown>) => operation(tx)) } as unknown as PrismaService;
  const reads = { notice: jest.fn().mockResolvedValue({ id: 'notice' }) } as unknown as PublicStatusRepository;
  return { tx, worker: new PublicationWorker(prisma, new ConfigService(), reads) };
}

describe('Publication ordering and recovery proof', () => {
  it('does not apply an older publication over a newer desired sequence', async () => {
    const app = fixture(); await app.worker.tick();
    expect(app.tx.statusPublication.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ state: 'SUPERSEDED' }) }));
    expect(app.tx.publicServiceStatus.update).not.toHaveBeenCalled();
  });
  it('shares the running scan instead of starting overlapping loops', async () => {
    const app = fixture(); const first = app.worker.tick(); const second = app.worker.tick();
    expect(first).toBe(second); await first;
  });
  it('retries recovery verification after missing source data without consuming its evidence', async () => {
    const app = fixture(true); await app.worker.tick();
    expect(app.tx.statusPublication.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ lastError: 'RECOVERY_VERIFICATION_PENDING' }) }));
    expect(app.tx.statusPublication.update.mock.calls.some(([arg]) => 'visibleAt' in arg.data)).toBe(false);
    expect(app.tx.incidentEvent.create).not.toHaveBeenCalled();
  });
});
