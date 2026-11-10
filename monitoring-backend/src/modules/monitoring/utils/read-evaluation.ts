import type { OperationalEvaluation } from '@/modules/monitoring/interfaces/operational-evaluation';

const record = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

/** Ignore legacy/invalid evidence rather than resuming an untrusted confirmation sequence. */
export function readEvaluation(value: unknown): OperationalEvaluation | null {
  if (!record(value) || value.schemaVersion !== 1 || !record(value.profile) ||
    !Number.isInteger(value.serviceVersion) || Number(value.serviceVersion) < 1 ||
    typeof value.profile.version !== 'string' || typeof value.observedAt !== 'string' ||
    !Number.isFinite(Date.parse(value.observedAt)) ||
    !Number.isInteger(value.consecutiveDegradations) || Number(value.consecutiveDegradations) < 0 ||
    typeof value.healthy !== 'boolean' || typeof value.pendingConfirmation !== 'boolean' ||
    typeof value.technicalDataAvailable !== 'boolean' || typeof value.requiresHttpRecovery !== 'boolean' ||
    (value.lastConfirmedStatus !== null && !['OPERATIONAL', 'DEGRADED', 'UNAVAILABLE'].includes(String(value.lastConfirmedStatus))) ||
    !record(value.probe) || !record(value.risk) || !Array.isArray(value.reasons)) return null;
  for (const date of [value.firstSignalAt, value.confirmedAt]) {
    if (date !== null && (typeof date !== 'string' || !Number.isFinite(Date.parse(date)))) return null;
  }
  for (const field of ['latencyThresholdMs', 'maxHealthFailures', 'degradationSamples',
    'degradationDurationMs', 'recoverySamples', 'observationMaxAgeMs', 'httpErrorRateThreshold']) {
    if (typeof value.profile[field] !== 'number' || !Number.isFinite(value.profile[field]) || Number(value.profile[field]) <= 0) return null;
  }
  return value as unknown as OperationalEvaluation;
}
