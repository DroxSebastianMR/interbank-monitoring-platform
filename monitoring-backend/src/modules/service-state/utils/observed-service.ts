import { ServiceStatus, type ServiceSnapshot } from '@/modules/service-state/interfaces/service-state';
import { observationFreshness } from '@/modules/service-state/utils/observation-freshness';

/** Read model only. NO_DATA must never overwrite the last persisted technical state. */
export function observedService(
  service: ServiceSnapshot,
  maxAgeMs = service.evaluation?.profile.observationMaxAgeMs ?? 30_000,
  now = Date.now(),
) {
  const dataFreshness = observationFreshness(service, maxAgeMs, now);
  const pending = service.evaluation?.pendingConfirmation === true &&
    (service.status === ServiceStatus.OPERATIONAL || service.status === ServiceStatus.RECOVERING);
  return {
    ...service,
    status: dataFreshness !== 'CURRENT' || pending || service.evaluation?.technicalDataAvailable === false
      ? 'NO_DATA' as const : service.status,
    lastKnownStatus: service.evaluation?.lastConfirmedStatus ?? service.status,
    pendingConfirmation: pending,
    dataFreshness,
    riskLevel: dataFreshness === 'CURRENT' ? service.riskLevel : null,
    anomalyScore: dataFreshness === 'CURRENT' ? service.anomalyScore : null,
  };
}
