import { Injectable, NotFoundException, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '@/common/prisma/prisma.service';
import { OperationalEventsService } from '@/modules/realtime/services/operational-events.service';
import { OperationalChannel, OperationalEventType } from '@/modules/realtime/enums/operational-event.enum';
import type { IncidentEvidence } from '@/modules/incidents/interfaces/incident-evidence.interface';
import { ServiceStatus } from '@/modules/service-state/interfaces/service-state';
import { technicalSeverity } from '@/modules/incidents/policies/incident-workflow.policy';
import { incidentClosureBlockers } from '@/modules/incidents/policies/incident-closure.policy';
import { incidentPeople, eligibleAssignee } from '@/modules/incidents/repositories/incident-selectors';
import { IncidentEventKind as Kind } from '@/modules/incidents/enums/incident-workflow.enum';
import { observationFreshness } from '@/modules/service-state/utils/observation-freshness';

@Injectable()
export class IncidentsRepository {
  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly events?: OperationalEventsService,
    @Optional() private readonly config?: ConfigService,
  ) {}

  findAll() {
    return this.prisma.incident.findMany({ orderBy: [{ closedAt: { sort: 'desc', nulls: 'first' } }, { openedAt: 'desc' }, { id: 'desc' }], take: 100, include: incidentPeople });
  }

  assignees() {
    return this.prisma.employee.findMany({ where: eligibleAssignee,
      select: { id: true, employeeCode: true, firstName: true, lastName: true },
      orderBy: [{ lastName: 'asc' }, { id: 'asc' }], take: 100 });
  }

  async detail(id: string) {
    const incident = await this.prisma.incident.findUnique({ where: { id }, include: incidentPeople });
    if (!incident) throw new NotFoundException('Incidente no encontrado');
    return { ...incident, closureBlockers: await incidentClosureBlockers(this.prisma, incident) };
  }

  async timeline(id: string, beforeVersion?: number) {
    if (!await this.prisma.incident.findUnique({ where: { id }, select: { id: true } })) {
      throw new NotFoundException('Incidente no encontrado');
    }
    const rows = await this.prisma.incidentEvent.findMany({
      where: { incidentId: id, ...(beforeVersion !== undefined ? { version: { lt: beforeVersion } } : {}) },
      orderBy: { version: 'desc' }, take: 51,
      include: { actor: { select: { id: true, firstName: true, lastName: true } } },
    });
    return { items: rows.slice(0, 50), nextBeforeVersion: rows.length > 50 ? rows[49].version : null };
  }

  /** Serialize automated and operator changes on the same existing service row. */
  async sync(serviceKey: string, status: ServiceStatus, evidence: IncidentEvidence): Promise<void> {
    const result = await this.prisma.$transaction(async (tx) => {
      const locked = await tx.$queryRaw<Array<{ id: string }>>`
        SELECT "id" FROM "monitoring"."MonitoredService" WHERE "code" = ${serviceKey} FOR UPDATE`;
      if (!locked.length) throw new NotFoundException('Servicio monitoreado no encontrado');
      const service = await tx.monitoredService.findUniqueOrThrow({ where: { code: serviceKey } });
      const observedAt = new Date(evidence.observedAt);
      // Ignore a delayed result superseded by another persisted technical observation.
      if (!Number.isFinite(observedAt.getTime()) || !service.lastCheckedAt ||
        observedAt.getTime() !== service.lastCheckedAt.getTime() || service.status !== status || !service.monitoringEnabled) return null;
      if (observationFreshness({ lastCheckedAt: service.lastCheckedAt.toISOString(), monitoringEnabled: service.monitoringEnabled },
        this.config?.get<number>('rules.observationMaxAgeMs', 30_000)) !== 'CURRENT') return null;
      const current = await tx.incident.findFirst({ where: { serviceKey, closedAt: null } });
      if (!current) {
        if (status !== ServiceStatus.DEGRADED && status !== ServiceStatus.UNAVAILABLE) return null;
        const previous = await tx.incident.findFirst({ where: { serviceKey, closedAt: { not: null } }, orderBy: [{ closedAt: 'desc' }, { id: 'desc' }], select: { id: true } });
        const created = await tx.incident.create({ data: {
          id: randomUUID(), serviceKey, title: `${serviceKey}: afectación confirmada`, status: 'OPEN', technicalStatus: status,
          severity: technicalSeverity(status === ServiceStatus.UNAVAILABLE, service.criticality),
          evidence: { ...evidence }, lastEvidence: { ...evidence }, lastObservedAt: observedAt,
          previousIncidentId: previous?.id,
        } });
        await this.event(tx, created, Kind.DETECTED, 'Afectación técnica confirmada.', { evidence: { ...evidence } });
        await tx.alert.create({ data: { incidentId: created.id, kind: 'OPENED', message: created.title } });
        await this.outbox(tx, created.id, 'incident.created');
        return { id: created.id, created: true };
      }
      if (observedAt.getTime() <= current.lastObservedAt.getTime()) return null;
      const data: Prisma.IncidentUpdateInput = { lastObservedAt: observedAt, lastEvidence: { ...evidence }, technicalStatus: status };
      let kind: Kind | null = null;
      let reason = '';
      let alertKind: string | null = null;
      if (status === ServiceStatus.OPERATIONAL && current.status !== 'RESOLVED') {
        Object.assign(data, { status: 'RESOLVED', attentionState: 'RESOLVED', resolvedAt: observedAt, recoveryEvidence: { ...evidence } });
        kind = Kind.RECOVERED; reason = 'Recuperación técnica confirmada por el motor.'; alertKind = 'RECOVERY';
      } else if ((status === ServiceStatus.DEGRADED || status === ServiceStatus.UNAVAILABLE) && current.resolvedAt) {
        Object.assign(data, { status: 'OPEN', attentionState: 'INVESTIGATING', resolvedAt: null,
          recoveryEvidence: Prisma.DbNull, acknowledgedAt: null, acknowledgedBy: { disconnect: true }, occurrence: { increment: 1 } });
        kind = Kind.REOPENED; reason = 'Nueva afectación antes del cierre; se conserva el expediente.'; alertKind = 'OPENED';
      } else if (status === ServiceStatus.RECOVERING && current.status === 'OPEN' && current.attentionState !== 'RECOVERING') {
        data.attentionState = 'RECOVERING'; kind = Kind.RECOVERY_STARTED;
        reason = 'El motor está verificando la recuperación; todavía no está confirmada.';
      } else if ((status === ServiceStatus.DEGRADED || status === ServiceStatus.UNAVAILABLE) &&
        current.technicalStatus === ServiceStatus.RECOVERING && current.attentionState === 'RECOVERING') {
        data.attentionState = 'INVESTIGATING'; kind = Kind.TECHNICAL_CHANGED;
        reason = 'La recuperación se interrumpió; continúa la investigación de la afectación.';
      }
      if ((status === ServiceStatus.DEGRADED || status === ServiceStatus.UNAVAILABLE) && !current.severityOverride) {
        const severity = technicalSeverity(status === ServiceStatus.UNAVAILABLE, service.criticality);
        if (current.severity !== severity) {
          data.severity = severity;
          if (!kind) { kind = Kind.TECHNICAL_CHANGED; reason = 'Cambió la severidad calculada por criticidad y condición técnica.'; }
          if (severity === 'CRITICAL' || severity === 'HIGH') alertKind = alertKind ?? 'ESCALATED';
        }
      }
      if (!kind && current.technicalStatus !== status) {
        kind = Kind.TECHNICAL_CHANGED; reason = 'Cambió la condición técnica observada por el motor.';
      }
      if (!kind) {
        await tx.incident.update({ where: { id: current.id }, data });
        return null; // No workflow-version churn on every health check.
      }
      data.version = { increment: 1 };
      const updated = await tx.incident.update({ where: { id: current.id }, data });
      await this.event(tx, updated, kind, reason, { evidence: { ...evidence }, previousAttentionState: current.attentionState });
      if (alertKind) await tx.alert.create({ data: { incidentId: current.id, kind: alertKind, message: `${serviceKey}: ${reason}` } });
      await this.outbox(tx, current.id, kind === Kind.RECOVERED ? 'incident.resolved' : 'incident.updated');
      return { id: current.id, created: false };
    }, { timeout: 5000 });
    if (result) this.events?.publish(OperationalChannel.INCIDENTS,
      result.created ? OperationalEventType.INCIDENT_CREATED : OperationalEventType.INCIDENT_UPDATED,
      { incidentId: result.id });
  }

  private event(tx: Prisma.TransactionClient, incident: { id: string; version: number; occurrence: number }, kind: Kind, reason: string, payload: Prisma.InputJsonValue) {
    return tx.incidentEvent.create({ data: { incidentId: incident.id, version: incident.version,
      occurrence: incident.occurrence, kind, origin: 'SYSTEM', reason, payload } });
  }

  private async outbox(tx: Prisma.TransactionClient, incidentId: string, eventType: string) {
    if (this.config?.get<string>('MONITORING_DELIVERY_ENABLED') === 'true') {
      await tx.operationalOutbox.create({ data: { incidentId, eventType } });
    }
  }
}
