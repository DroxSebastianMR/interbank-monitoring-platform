import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException, Optional } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/common/prisma/prisma.service';
import { IncidentAction, IncidentEventKind } from '@/modules/incidents/enums/incident-workflow.enum';
import type { IncidentCommandDto, AssignIncidentDto, AddIncidentNoteDto, TransitionIncidentDto, ReclassifyIncidentDto, CloseIncidentDto } from '@/modules/incidents/dto/incident-action.dto';
import { assertAttentionTransition } from '@/modules/incidents/policies/incident-workflow.policy';
import { incidentClosureBlockers } from '@/modules/incidents/policies/incident-closure.policy';
import { eligibleAssignee } from '@/modules/incidents/repositories/incident-selectors';
import { OperationalEventsService } from '@/modules/realtime/services/operational-events.service';
import { OperationalChannel, OperationalEventType } from '@/modules/realtime/enums/operational-event.enum';

type IncidentCommand =
  | { kind: IncidentAction.ASSIGN; input: AssignIncidentDto }
  | { kind: IncidentAction.ACKNOWLEDGE; input: IncidentCommandDto }
  | { kind: IncidentAction.NOTE; input: AddIncidentNoteDto }
  | { kind: IncidentAction.TRANSITION; input: TransitionIncidentDto }
  | { kind: IncidentAction.RECLASSIFY; input: ReclassifyIncidentDto }
  | { kind: IncidentAction.CLOSE; input: CloseIncidentDto };

@Injectable()
export class IncidentWorkflowRepository {
  constructor(private readonly prisma: PrismaService,
    @Optional() private readonly events?: OperationalEventsService) {}

  async execute(id: string, actorId: string, command: IncidentCommand) {
    const initial = await this.prisma.incident.findUnique({ where: { id }, select: { serviceKey: true } });
    if (!initial) throw new NotFoundException('Incidente no encontrado');
    const values = this.values(command);
    const fingerprint = createHash('sha256').update(JSON.stringify({ kind: command.kind,
      version: command.input.expectedVersion, reason: command.input.reason.trim(), values })).digest('hex');
    const receipt = await this.prisma.$transaction(async (tx) => {
      const locked = await tx.$queryRaw<Array<{ id: string }>>`SELECT "id" FROM "monitoring"."MonitoredService" WHERE "code" = ${initial.serviceKey} FOR UPDATE`;
      if (!locked.length) throw new ConflictException('El servicio del incidente no está disponible en el catálogo.');
      const actor = await tx.employee.findFirst({ where: { id: actorId, ...eligibleAssignee }, select: { id: true } });
      if (!actor) throw new ForbiddenException('El operador ya no está habilitado para gestionar incidentes.');
      const incident = await tx.incident.findUniqueOrThrow({ where: { id } });
      const duplicate = await tx.incidentEvent.findUnique({ where: { incidentId_commandId: { incidentId: id, commandId: command.input.commandId } } });
      if (duplicate) {
        if (duplicate.actorId !== actorId || duplicate.commandFingerprint !== fingerprint) {
          throw new ConflictException('La clave del comando ya corresponde a otra operación.');
        }
        return { incidentId: id, eventId: duplicate.id, appliedVersion: duplicate.version, replayed: true };
      }
      if (incident.version !== command.input.expectedVersion) {
        throw new ConflictException({ code: 'INCIDENT_VERSION_CONFLICT', message: 'El incidente cambió. Recarga el expediente antes de guardar.' });
      }
      if (incident.closedAt) throw new ConflictException('Un expediente cerrado no admite modificaciones.');
      const data: Prisma.IncidentUpdateInput = { version: { increment: 1 } };
      let eventKind: IncidentEventKind;
      switch (command.kind) {
        case IncidentAction.ASSIGN: {
          const owner = await tx.employee.findFirst({ where: { id: command.input.assigneeId, ...eligibleAssignee }, select: { id: true } });
          if (!owner) throw new BadRequestException('El responsable debe estar activo y habilitado para atender incidentes.');
          if (incident.assigneeId === owner.id) throw new ConflictException('El incidente ya tiene ese responsable.');
          data.assignee = { connect: { id: owner.id } }; eventKind = IncidentEventKind.ASSIGNED; break;
        }
        case IncidentAction.ACKNOWLEDGE:
          if (incident.acknowledgedAt) throw new ConflictException('El incidente ya fue reconocido.');
          if (!incident.assigneeId) throw new ConflictException('Asigna un responsable antes de reconocer el incidente.');
          if (!await tx.employee.findFirst({ where: { id: incident.assigneeId, ...eligibleAssignee }, select: { id: true } })) {
            throw new ConflictException('El responsable actual ya no está habilitado.');
          }
          data.acknowledgedAt = new Date(); data.acknowledgedBy = { connect: { id: actorId } };
          eventKind = IncidentEventKind.ACKNOWLEDGED; break;
        case IncidentAction.NOTE:
          eventKind = IncidentEventKind.NOTE_ADDED; break;
        case IncidentAction.TRANSITION:
          if (!incident.assigneeId || !incident.acknowledgedAt) throw new ConflictException('Asigna y reconoce el incidente antes de cambiar su atención.');
          if (!await tx.employee.findFirst({ where: { id: incident.assigneeId, ...eligibleAssignee }, select: { id: true } })) {
            throw new ConflictException('El responsable actual ya no está habilitado.');
          }
          assertAttentionTransition(incident.attentionState, command.input.nextState);
          data.attentionState = command.input.nextState; eventKind = IncidentEventKind.ATTENTION_CHANGED; break;
        case IncidentAction.RECLASSIFY:
          if (incident.severity === command.input.severity) throw new ConflictException('La severidad ya tiene ese valor.');
          data.severity = command.input.severity; data.severityOverride = true;
          eventKind = IncidentEventKind.SEVERITY_CHANGED; break;
        case IncidentAction.CLOSE: {
          const blockers = await incidentClosureBlockers(tx, incident);
          if (blockers.length) throw new ConflictException({ code: 'INCIDENT_CLOSURE_BLOCKED', message: 'El incidente todavía no cumple las condiciones de cierre.', blockers });
          data.attentionState = 'CLOSED'; data.closedAt = new Date(); data.closingSummary = command.input.summary.trim();
          eventKind = IncidentEventKind.CLOSED; break;
        }
        default: throw new BadRequestException('Acción de incidente no permitida.');
      }
      const updated = await tx.incident.update({ where: { id, version: incident.version, closedAt: null }, data });
      const event = await tx.incidentEvent.create({ data: {
        incidentId: id, version: updated.version, occurrence: updated.occurrence, kind: eventKind,
        origin: 'OPERATOR', actorId, reason: command.input.reason.trim(),
        commandId: command.input.commandId, commandFingerprint: fingerprint,
        payload: { before: { assigneeId: incident.assigneeId, attentionState: incident.attentionState, severity: incident.severity }, ...values },
      } });
      await tx.auditLog.create({ data: { actorId, action: `INCIDENT_${command.kind}`, resource: 'incident', resourceId: id,
        outcome: 'SUCCESS', metadata: { eventId: event.id, reason: command.input.reason.trim(), previousVersion: incident.version, version: updated.version } } });
      return { incidentId: id, eventId: event.id, appliedVersion: updated.version, replayed: false };
    }, { timeout: 5000 });
    if (!receipt.replayed) this.events?.publish(OperationalChannel.INCIDENTS, OperationalEventType.INCIDENT_UPDATED, { incidentId: id });
    return receipt;
  }

  private values(command: IncidentCommand): Prisma.InputJsonObject {
    switch (command.kind) {
      case IncidentAction.ASSIGN: return { assigneeId: command.input.assigneeId };
      case IncidentAction.TRANSITION: return { nextState: command.input.nextState };
      case IncidentAction.RECLASSIFY: return { severity: command.input.severity };
      case IncidentAction.NOTE: return { note: command.input.note.trim() };
      case IncidentAction.CLOSE: return { summary: command.input.summary.trim() };
      case IncidentAction.ACKNOWLEDGE: return {};
      default: throw new BadRequestException('Acción de incidente no permitida.');
    }
  }
}
