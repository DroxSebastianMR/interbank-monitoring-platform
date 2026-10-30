import { Injectable, Logger, OnModuleDestroy, OnModuleInit, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/common/prisma/prisma.service';
import { queuePublicNotice } from '@/modules/public-status/repositories/queue-public-notice';
import { PublicStatusRepository } from '@/modules/public-status/repositories/public-status.repository';
import { PUBLIC_SERVICES, FOLLOW_UP_INTERVAL_MS, publicState } from '@/modules/public-status/policies/public-notice.policy';
import { PublicNoticeKind as Kind } from '@/modules/public-status/enums/public-notice.enum';
import { publicObservation } from '@/modules/public-status/policies/public-source-observation';
import { OperationalEventsService } from '@/modules/realtime/services/operational-events.service';
import { OperationalChannel, OperationalEventType } from '@/modules/realtime/enums/operational-event.enum';

@Injectable()
export class PublicationWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PublicationWorker.name);
  private timer?: NodeJS.Timeout;
  private running?: Promise<void>;
  private lastReconcile = 0;
  private stopping = false;
  constructor(private readonly prisma: PrismaService, private readonly config: ConfigService,
    private readonly publicReads: PublicStatusRepository,
    @Optional() private readonly events?: OperationalEventsService) {}

  onModuleInit() {
    if (this.config.get<boolean>('app.docsOnly', false) || this.config.get<string>('PUBLIC_STATUS_ENABLED', 'false') !== 'true') return;
    this.timer = setInterval(() => { void this.tick(); }, 5000);
    this.timer.unref(); void this.tick();
  }
  async onModuleDestroy() { this.stopping = true; if (this.timer) clearInterval(this.timer); await this.running; }
  tick(): Promise<void> {
    if (this.running) return this.running;
    this.running = this.process().catch(() => this.logger.warn('Public publisher unavailable; pending notices remain durable'))
      .finally(() => { this.running = undefined; });
    return this.running;
  }

  private async process() {
    if (this.stopping) return;
    if (Date.now() - this.lastReconcile >= 10_000) { await this.reconcile(); this.lastReconcile = Date.now(); }
    const jobs = await this.prisma.statusPublication.findMany({
      where: { state: 'PENDING', nextAttemptAt: { lte: new Date() } }, orderBy: [{ createdAt: 'asc' }, { id: 'asc' }], take: 20,
    });
    for (const job of jobs) {
      if (this.stopping) break;
      try { await this.publish(job.id); } catch { await this.retryLater(job.id, job.attempts); }
    }
    const visible = await this.prisma.statusPublication.findMany({
      where: { state: 'PUBLISHED', visibleAt: null, nextAttemptAt: { lte: new Date() } },
      orderBy: [{ publishedAt: 'asc' }, { id: 'asc' }], take: 20,
    });
    for (const job of visible) {
      if (this.stopping) break;
      try { await this.verifyVisible(job.id); } catch { await this.retryLater(job.id, job.attempts); }
    }
  }

  private async retryLater(id: string, attempts: number) {
    try {
      await this.prisma.statusPublication.update({ where: { id }, data: { attempts: { increment: 1 },
        lastError: 'PUBLICATION_RETRY_PENDING', nextAttemptAt: new Date(Date.now() + Math.min(60_000, 1000 * 2 ** Math.min(attempts, 6))) } });
    } catch { this.logger.warn('Could not persist publication retry; source notice is not discarded'); }
  }

  /** Reconcile after restart, bootstrap healthy services and send five-minute follow-ups. */
  private async reconcile() {
    const [sources, states, incidents] = await Promise.all([
      this.prisma.monitoredService.findMany({ where: { code: { in: Object.keys(PUBLIC_SERVICES) } } }),
      this.prisma.publicServiceStatus.findMany({ where: { serviceKey: { in: Object.keys(PUBLIC_SERVICES) } }, include: { lastPublication: true } }),
      this.prisma.incident.findMany({ where: { serviceKey: { in: Object.keys(PUBLIC_SERVICES) }, closedAt: null } }),
    ]);
    for (const source of sources) {
      if (this.stopping) break;
      const status = publicObservation(source).status;
      if (status === 'NO_DATA') continue;
      const state = states.find((item) => item.serviceKey === source.code);
      const incident = incidents.find((item) => item.serviceKey === source.code);
      let kind: Kind | null = null;
      let key = '';
      if (incident?.resolvedAt && status === 'OPERATIONAL') {
        kind = Kind.RECOVERY; key = `${incident.id}:${incident.occurrence}:RECOVERY:c${source.version}`;
      } else if (incident && !incident.resolvedAt && status !== 'OPERATIONAL') {
        if (!state?.lastPublication || state.lastPublication.incidentId !== incident.id || state.lastPublication.occurrence !== incident.occurrence) {
          kind = Kind.INITIAL; key = `${incident.id}:${incident.occurrence}:INITIAL:c${source.version}`;
        } else if (state.lastPublication.sourceTechnicalStatus !== source.status) {
          kind = Kind.UPDATE; key = `${incident.id}:${incident.occurrence}:UPDATE:${incident.version}:c${source.version}`;
        } else if (state.lastPublication.publishedAt && Date.now() - state.lastPublication.publishedAt.getTime() >= FOLLOW_UP_INTERVAL_MS) {
          kind = Kind.FOLLOW_UP; key = `${incident.id}:${incident.occurrence}:FOLLOW_UP:${Math.floor(Date.now() / FOLLOW_UP_INTERVAL_MS)}:c${source.version}`;
        }
      } else if (status === 'OPERATIONAL' && !incident && (!state?.publishedSequence || state.status !== 'OPERATIONAL')) {
        kind = Kind.SNAPSHOT; key = `${source.code}:SNAPSHOT:${source.lastCheckedAt!.toISOString()}:c${source.version}`;
      }
      if (!kind) continue;
      await this.prisma.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT "id" FROM "monitoring"."MonitoredService" WHERE "code" = ${source.code} FOR UPDATE`;
        const latest = await tx.monitoredService.findUniqueOrThrow({ where: { code: source.code } });
        if (latest.version !== source.version || latest.lastCheckedAt?.getTime() !== source.lastCheckedAt?.getTime()) return;
        if (await tx.statusPublication.findFirst({ where: { serviceKey: source.code, state: 'PENDING' }, select: { id: true } })) return;
        await queuePublicNotice(tx, { serviceKey: source.code, serviceVersion: source.version, technicalStatus: source.status,
          incidentId: incident?.id, occurrence: incident?.occurrence, kind: kind!, deduplicationKey: key });
      });
    }
  }

  private async publish(id: string) {
    const initial = await this.prisma.statusPublication.findUniqueOrThrow({ where: { id } });
    await this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "monitoring"."MonitoredService" WHERE "code" = ${initial.serviceKey} FOR UPDATE`;
      const job = await tx.statusPublication.findUniqueOrThrow({ where: { id } });
      if (job.state !== 'PENDING') return;
      const state = await tx.publicServiceStatus.findUniqueOrThrow({ where: { serviceKey: job.serviceKey } });
      const source = await tx.monitoredService.findUniqueOrThrow({ where: { code: job.serviceKey } });
      const incident = job.incidentId ? await tx.incident.findUnique({ where: { id: job.incidentId } }) : null;
      const preventiveExpired = job.kind === Kind.PREVENTIVE &&
        (publicObservation(source).evaluation?.risk.status !== 'AVAILABLE' || publicObservation(source).evaluation?.risk.level !== 'HIGH');
      const superseded = preventiveExpired || state.nextSequence !== job.sequence || source.version !== job.sourceServiceVersion ||
        (job.incidentId !== null && (!incident || incident.occurrence !== job.occurrence || !!incident.closedAt)) ||
        (job.kind === Kind.RECOVERY && !incident?.resolvedAt) ||
        ([Kind.INITIAL, Kind.UPDATE, Kind.FOLLOW_UP].includes(job.kind as Kind) && !!incident?.resolvedAt) ||
        (job.expiresAt !== null && job.expiresAt.getTime() <= Date.now());
      if (superseded) { await tx.statusPublication.update({ where: { id }, data: { state: 'SUPERSEDED', lastError: 'NEWER_CONDITION_EXISTS' } }); return; }
      const observed = publicObservation(source).status;
      if (observed === 'NO_DATA') {
        await tx.statusPublication.update({ where: { id }, data: { lastError: 'SOURCE_NO_RECENT_DATA', nextAttemptAt: new Date(Date.now() + 5000) } }); return;
      }
      if (observed !== job.sourceTechnicalStatus) {
        await tx.statusPublication.update({ where: { id }, data: { state: 'SUPERSEDED', lastError: 'TECHNICAL_CONDITION_CHANGED' } }); return;
      }
      await tx.statusPublication.update({ where: { id }, data: { state: 'PUBLISHED', publishedAt: new Date(), attempts: { increment: 1 }, lastError: null, nextAttemptAt: new Date() } });
      await tx.publicServiceStatus.update({ where: { serviceKey: job.serviceKey }, data: { status: publicState(observed), publishedSequence: job.sequence, lastPublicationId: id } });
    });
  }

  private async verifyVisible(id: string) {
    // Same whitelist/projection used by GET /public/status/notices/:id. Not a push receipt.
    await this.publicReads.notice(id);
    const initial = await this.prisma.statusPublication.findUniqueOrThrow({ where: { id } });
    const incidentId = await this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "monitoring"."MonitoredService" WHERE "code" = ${initial.serviceKey} FOR UPDATE`;
      const job = await tx.statusPublication.findUniqueOrThrow({ where: { id } });
      if (job.visibleAt || job.state !== 'PUBLISHED') return null;
      const visibleAt = new Date();
      if (job.kind !== Kind.RECOVERY || !job.incidentId) {
        await tx.statusPublication.update({ where: { id }, data: { visibleAt, lastError: null } }); return null;
      }
      const incident = await tx.incident.findUniqueOrThrow({ where: { id: job.incidentId } });
      const source = await tx.monitoredService.findUniqueOrThrow({ where: { code: job.serviceKey } });
      if (incident.occurrence === job.occurrence && incident.resolvedAt && !incident.closedAt && publicObservation(source).status !== 'OPERATIONAL') {
        await tx.statusPublication.update({ where: { id }, data: { lastError: 'RECOVERY_VERIFICATION_PENDING', nextAttemptAt: new Date(Date.now() + 5000) } }); return null;
      }
      await tx.statusPublication.update({ where: { id }, data: { visibleAt, lastError: null } });
      if (incident.occurrence !== job.occurrence || !incident.resolvedAt || incident.closedAt) return null;
      const updated = await tx.incident.update({ where: { id: incident.id }, data: { version: { increment: 1 } } });
      await tx.incidentEvent.create({ data: { incidentId: incident.id, version: updated.version, occurrence: incident.occurrence,
        kind: 'RECOVERY_PUBLISHED', origin: 'SYSTEM', reason: 'Aviso de recuperación disponible mediante la API pública.',
        payload: { publicationId: id, visibleAt: visibleAt.toISOString() } } });
      return incident.id;
    });
    if (incidentId) this.events?.publish(OperationalChannel.INCIDENTS, OperationalEventType.INCIDENT_UPDATED, { incidentId });
  }
}
