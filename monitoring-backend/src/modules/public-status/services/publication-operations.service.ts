import { ConflictException, ForbiddenException, Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/common/prisma/prisma.service';
import { queuePublicNotice } from '@/modules/public-status/repositories/queue-public-notice';
import { PublicNoticeKind } from '@/modules/public-status/enums/public-notice.enum';
import { PublicationWorker } from '@/modules/public-status/services/publication-worker.service';
import { ApprovePreventiveNoticeDto } from '@/modules/public-status/dto/approve-preventive-notice.dto';
import { publicObservation } from '@/modules/public-status/policies/public-source-observation';

const actorWhere = (id: string, permission: string) => ({ id, status: 'ACTIVE' as const,
  AND: ['notifications.manage', permission].map((code) => ({ roles: { some: { role: { permissions: { some: { permission: { code } } } } } } })) });

@Injectable()
export class PublicationOperations {
  constructor(private readonly prisma: PrismaService, private readonly config: ConfigService, private readonly worker: PublicationWorker) {}
  private requireEnabled() {
    if (this.config.get<string>('PUBLIC_STATUS_ENABLED', 'false') !== 'true') throw new ServiceUnavailableException('La publicación pública no está habilitada.');
  }

  async history(incidentId: string) {
    if (!await this.prisma.incident.findUnique({ where: { id: incidentId }, select: { id: true } })) throw new NotFoundException('Incidente no encontrado.');
    return { enabled: this.config.get<string>('PUBLIC_STATUS_ENABLED', 'false') === 'true', items: await this.prisma.statusPublication.findMany({
      where: { incidentId }, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], take: 100,
      select: { id: true, sequence: true, kind: true, state: true, attempts: true, lastError: true,
        createdAt: true, publishedAt: true, visibleAt: true, nextAttemptAt: true, title: true, body: true },
    }) };
  }

  async retry(id: string, actorId: string) {
    this.requireEnabled();
    await this.prisma.$transaction(async (tx) => {
      if (!await tx.employee.findFirst({ where: actorWhere(actorId, 'incidents.read'), select: { id: true } })) throw new ForbiddenException('El operador no está habilitado.');
      const result = await tx.statusPublication.updateMany({ where: { id, state: 'PENDING' }, data: { nextAttemptAt: new Date() } });
      if (!result.count) throw new ConflictException('El aviso no está pendiente o ya fue superado.');
      await tx.auditLog.create({ data: { actorId, action: 'PUBLIC_NOTICE_RETRY', resource: 'status-publication', resourceId: id, outcome: 'SUCCESS' } });
    });
    void this.worker.tick(); return { scheduled: true };
  }

  async approve(input: ApprovePreventiveNoticeDto, actorId: string) {
    this.requireEnabled();
    const result = await this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "monitoring"."MonitoredService" WHERE "code" = ${input.serviceKey} FOR UPDATE`;
      if (!await tx.employee.findFirst({ where: actorWhere(actorId, 'services.read'), select: { id: true } })) throw new ForbiddenException('El operador no está habilitado.');
      const key = `preventive:${actorId}:${input.commandId}`;
      const existing = await tx.statusPublication.findUnique({ where: { deduplicationKey: key } });
      if (existing) {
        if (existing.serviceKey !== input.serviceKey || existing.sourceServiceVersion !== input.expectedServiceVersion || existing.approvalReason !== input.reason.trim()) throw new ConflictException('La clave ya corresponde a otra autorización.');
        return { id: existing.id, replayed: true };
      }
      const source = await tx.monitoredService.findUnique({ where: { code: input.serviceKey } });
      if (!source) throw new NotFoundException('Servicio no encontrado.');
      if (source.version !== input.expectedServiceVersion) throw new ConflictException('La configuración cambió. Recarga el servicio.');
      const observed = publicObservation(source);
      const evaluation = observed.evaluation;
      const state = await tx.publicServiceStatus.findUnique({ where: { serviceKey: input.serviceKey } });
      const [pending, activeIncident] = await Promise.all([
        tx.statusPublication.findFirst({ where: { serviceKey: input.serviceKey, state: 'PENDING' }, select: { id: true } }),
        tx.incident.findFirst({ where: { serviceKey: input.serviceKey, resolvedAt: null, closedAt: null }, select: { id: true } }),
      ]);
      if (observed.status !== 'OPERATIONAL' || !evaluation || evaluation.serviceVersion !== source.version || evaluation.risk.status !== 'AVAILABLE' ||
        evaluation.risk.level !== 'HIGH' || state?.status !== 'OPERATIONAL' || pending || activeIncident) {
        throw new ConflictException('Solo puede autorizarse un aviso preventivo con riesgo alto reciente, sin afectación confirmada ni actualización pública pendiente.');
      }
      const publication = await queuePublicNotice(tx, { serviceKey: input.serviceKey, serviceVersion: source.version,
        technicalStatus: 'OPERATIONAL', kind: PublicNoticeKind.PREVENTIVE, deduplicationKey: key,
        approvedById: actorId, approvalReason: input.reason.trim() });
      if (!publication) throw new ConflictException('Servicio fuera del catálogo público.');
      await tx.auditLog.create({ data: { actorId, action: 'PUBLIC_PREVENTIVE_APPROVED', resource: 'status-publication', resourceId: publication.id,
        outcome: 'SUCCESS', metadata: { reason: input.reason.trim(), serviceKey: input.serviceKey } } });
      return { id: publication.id, replayed: false };
    });
    void this.worker.tick(); return result;
  }
}
