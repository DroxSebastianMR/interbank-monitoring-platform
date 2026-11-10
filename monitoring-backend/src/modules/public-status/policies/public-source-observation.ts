import type { MonitoredService } from '@prisma/client';
import { observedService } from '@/modules/service-state/utils/observed-service';
import type { ServiceSnapshot } from '@/modules/service-state/interfaces/service-state';
import { readEvaluation } from '@/modules/monitoring/utils/read-evaluation';

/** Private adapter shared by public reads, publishing and preventive approval. */
export function publicObservation(source: MonitoredService, now = Date.now()) {
  const evaluation = readEvaluation(source.evaluation);
  const observed = observedService({ id: source.code, name: '', path: '',
    status: source.status as ServiceSnapshot['status'], lastCheckedAt: source.lastCheckedAt?.toISOString() ?? null,
    latencyMs: source.lastLatencyMs, monitoringEnabled: source.monitoringEnabled,
    consecutiveFailures: source.consecutiveFailures, evaluation, message: '' }, undefined, now);
  return { status: evaluation?.serviceVersion === source.version ? observed.status : 'NO_DATA',
    observationMaxAgeMs: evaluation?.profile.observationMaxAgeMs ?? 30_000, evaluation };
}
