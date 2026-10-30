import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { publicObservation } from '@/modules/public-status/policies/public-source-observation';
import { PUBLIC_SERVICES, publicState } from '@/modules/public-status/policies/public-notice.policy';

export const publicNoticeFields = {
  id: true, serviceKey: true, sequence: true, kind: true, status: true,
  title: true, body: true, templateVersion: true, publishedAt: true, expiresAt: true,
} as const;

@Injectable()
export class PublicStatusRepository {
  constructor(private readonly prisma: PrismaService) {}

  async snapshot(serviceKey?: string) {
    const keys = serviceKey ? [serviceKey] : Object.keys(PUBLIC_SERVICES);
    const [sources, publications] = await Promise.all([
      this.prisma.monitoredService.findMany({ where: { code: { in: keys } } }),
      this.prisma.publicServiceStatus.findMany({ where: { serviceKey: { in: keys } },
        include: { lastPublication: { select: publicNoticeFields },
          publications: { where: { state: 'PENDING' }, orderBy: { sequence: 'desc' }, take: 1,
            select: { kind: true, status: true } } } }),
    ]);
    const now = Date.now();
    const services = keys.map((key) => {
      const source = sources.find((item) => item.code === key);
      const published = publications.find((item) => item.serviceKey === key);
      const observed = source ? publicObservation(source, now) : null;
      const pending = published?.publications[0];
      const current = observed && observed.status !== 'NO_DATA' &&
        publicState(observed.status) === published?.status && (published?.publishedSequence ?? 0) > 0 &&
        (!pending || pending.kind === 'PREVENTIVE' || (pending.status === published?.status && pending.kind !== 'RECOVERY'));
      const lastNotice = published?.lastPublication;
      return {
        serviceKey: key, name: PUBLIC_SERVICES[key], status: current ? published!.status : 'NO_DATA',
        lastKnownStatus: published && published.publishedSequence > 0 ? published.status : null,
        lastObservationAt: source?.lastCheckedAt?.toISOString() ?? null,
        observationMaxAgeMs: observed?.observationMaxAgeMs ?? 30_000,
        lastNotice: lastNotice && (!lastNotice.expiresAt || lastNotice.expiresAt.getTime() > now) ? lastNotice : null,
      };
    });
    return { schemaVersion: 1, generatedAt: new Date(now).toISOString(),
      environment: 'Laboratorio', services };
  }

  async history(serviceKey?: string, cursor?: string) {
    if (cursor && !await this.prisma.statusPublication.findFirst({ where: { id: cursor, state: 'PUBLISHED',
      ...(serviceKey ? { serviceKey } : { serviceKey: { in: Object.keys(PUBLIC_SERVICES) } }) }, select: { id: true } })) {
      throw new BadRequestException('Referencia de historial no válida.');
    }
    const items = await this.prisma.statusPublication.findMany({
      where: { state: 'PUBLISHED', publishedAt: { not: null },
        serviceKey: serviceKey ?? { in: Object.keys(PUBLIC_SERVICES) } },
      orderBy: [{ publishedAt: 'desc' }, { id: 'desc' }], take: 21,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}), select: publicNoticeFields,
    });
    return { items: items.slice(0, 20), nextCursor: items.length > 20 ? items[19].id : null };
  }

  async notice(id: string) {
    const item = await this.prisma.statusPublication.findFirst({ where: { id, state: 'PUBLISHED',
      publishedAt: { not: null }, serviceKey: { in: Object.keys(PUBLIC_SERVICES) } }, select: publicNoticeFields });
    if (!item) throw new NotFoundException('Aviso no disponible.');
    return item;
  }
}
