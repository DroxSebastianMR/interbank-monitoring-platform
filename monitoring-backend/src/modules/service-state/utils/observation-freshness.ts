import type { ServiceSnapshot } from '@/modules/service-state/interfaces/service-state';

export function observationFreshness(
  service: Pick<ServiceSnapshot, 'lastCheckedAt' | 'monitoringEnabled'>,
  maxAgeMs = 30_000,
  now = Date.now(),
): 'CURRENT' | 'STALE' | 'NO_DATA' {
  if (!service.lastCheckedAt || service.monitoringEnabled === false) return 'NO_DATA';
  const age = now - Date.parse(service.lastCheckedAt);
  return Number.isFinite(age) && age >= 0 && age <= maxAgeMs ? 'CURRENT' : 'STALE';
}
