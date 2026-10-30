import type { Incident, Prisma } from '@prisma/client';
import { readEvaluation } from '@/modules/monitoring/utils/read-evaluation';
import { observationFreshness } from '@/modules/service-state/utils/observation-freshness';
import { eligibleAssignee } from '@/modules/incidents/repositories/incident-selectors';

export async function incidentClosureBlockers(db: Prisma.TransactionClient, incident: Incident) {
  const blockers: string[] = [];
  if (incident.closedAt) return ['El expediente ya está cerrado.'];
  if (incident.attentionState !== 'RESOLVED' || !incident.resolvedAt) {
    blockers.push('Falta recuperación técnica confirmada por el motor.');
  }
  const [owner, service, publication] = await Promise.all([
    incident.assigneeId ? db.employee.findFirst({ where: { id: incident.assigneeId, ...eligibleAssignee }, select: { id: true } }) : null,
    db.monitoredService.findUnique({ where: { code: incident.serviceKey } }),
    db.incidentEvent.findFirst({
      where: { incidentId: incident.id, occurrence: incident.occurrence, origin: 'SYSTEM', kind: 'RECOVERY_PUBLISHED' },
      orderBy: { version: 'desc' },
    }),
  ]);
  if (!owner) blockers.push('Debe existir un responsable activo y habilitado.');
  if (!incident.acknowledgedAt) blockers.push('Falta reconocimiento del incidente.');
  if (!incident.recoveryEvidence) blockers.push('Falta evidencia de recuperación.');
  const evaluation = service ? readEvaluation(service.evaluation) : null;
  if (!service || service.status !== 'OPERATIONAL' || !evaluation?.healthy ||
    evaluation.serviceVersion !== service.version || !evaluation.technicalDataAvailable || evaluation.pendingConfirmation ||
    evaluation.lastConfirmedStatus !== 'OPERATIONAL' ||
    observationFreshness({ lastCheckedAt: service.lastCheckedAt?.toISOString() ?? null,
      monitoringEnabled: service.monitoringEnabled }, evaluation?.profile.observationMaxAgeMs) !== 'CURRENT') {
    blockers.push('La última comprobación del servicio debe ser reciente y saludable.');
  }
  const payload = publication?.payload;
  const visibleAt = payload && typeof payload === 'object' && !Array.isArray(payload) ? payload.visibleAt : null;
  const publicationId = payload && typeof payload === 'object' && !Array.isArray(payload) ? payload.publicationId : null;
  if (typeof publicationId !== 'string' || !publicationId.trim() || typeof visibleAt !== 'string' ||
    !incident.resolvedAt || !Number.isFinite(Date.parse(visibleAt)) || Date.parse(visibleAt) > Date.now() || Date.parse(visibleAt) < incident.resolvedAt.getTime()) {
    blockers.push('Falta publicación verificada del aviso de recuperación; integración pendiente del publicador.');
  }
  return blockers;
}
