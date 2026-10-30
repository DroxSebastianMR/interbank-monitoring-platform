import type { Incident, Prisma } from '@prisma/client';
import { incidentClosureBlockers } from '@/modules/incidents/policies/incident-closure.policy';
import type { OperationalEvaluation } from '@/modules/monitoring/interfaces/operational-evaluation';

function fixture() {
  const now = new Date();
  const resolvedAt = new Date(now.getTime() - 1000);
  const evaluation: OperationalEvaluation = {
    schemaVersion: 1, serviceVersion: 1, observedAt: now.toISOString(),
    profile: { version: 'operational-v1', latencyThresholdMs: 1000, maxHealthFailures: 3,
      degradationSamples: 3, degradationDurationMs: 20000, recoverySamples: 3,
      observationMaxAgeMs: 30000, httpErrorRateThreshold: 0.1 },
    probe: { source: 'health-probe', reachable: true, timedOut: false, latencyMs: 20, sampleCount: 3,
      windowStart: resolvedAt.toISOString(), windowEnd: now.toISOString(), latencyP95Ms: 20, failureRate: 0, timeoutRate: 0 },
    http: null, risk: { source: 'probe-window-with-http-rate', httpRequestRateHz: null, status: 'INSUFFICIENT_DATA', score: null, level: null },
    reasons: [], consecutiveDegradations: 0, firstSignalAt: null, confirmedAt: resolvedAt.toISOString(),
    lastConfirmedStatus: 'OPERATIONAL', pendingConfirmation: false, healthy: true,
    technicalDataAvailable: true, requiresHttpRecovery: false,
  };
  const incident = { id: 'incident', serviceKey: 'login', occurrence: 1, closedAt: null, attentionState: 'RESOLVED',
    resolvedAt, assigneeId: 'owner', acknowledgedAt: resolvedAt, recoveryEvidence: { confirmed: true } } as Incident;
  const service = { status: 'OPERATIONAL', version: 1, monitoringEnabled: true, lastCheckedAt: now, evaluation };
  const db = {
    employee: { findFirst: jest.fn().mockResolvedValue({ id: 'owner' }) },
    monitoredService: { findUnique: jest.fn().mockResolvedValue(service) },
    incidentEvent: { findFirst: jest.fn().mockResolvedValue(null) },
  };
  return { db, incident, service };
}

describe('Incident closure evidence', () => {
  it('blocks closure without a verified recovery publication', async () => {
    const app = fixture();
    const blockers = await incidentClosureBlockers(app.db as unknown as Prisma.TransactionClient, app.incident);
    expect(blockers.some((item) => item.includes('publicación verificada'))).toBe(true);
  });
  it('accepts complete evidence of the current recovered occurrence', async () => {
    const app = fixture();
    app.db.incidentEvent.findFirst.mockResolvedValue({ payload: { publicationId: 'publication', visibleAt: new Date().toISOString() } });
    expect(await incidentClosureBlockers(app.db as unknown as Prisma.TransactionClient, app.incident)).toEqual([]);
    expect(app.db.incidentEvent.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ occurrence: 1, origin: 'SYSTEM', kind: 'RECOVERY_PUBLISHED' }) }));
  });
  it('does not accept stale, paused or unhealthy technical information as recovery', async () => {
    const app = fixture();
    app.service.lastCheckedAt = new Date(Date.now() - 60000);
    app.db.monitoredService.findUnique.mockResolvedValue(app.service);
    const blockers = await incidentClosureBlockers(app.db as unknown as Prisma.TransactionClient, app.incident);
    expect(blockers.some((item) => item.includes('reciente y saludable'))).toBe(true);
  });
});
