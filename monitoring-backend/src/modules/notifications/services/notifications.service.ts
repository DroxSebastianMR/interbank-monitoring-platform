import { BadRequestException, Injectable, ServiceUnavailableException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/common/prisma/prisma.service';
import { NotificationInboxQueryDto } from '@/modules/notifications/dto/notification-inbox-query.dto';
import type { NotificationInboxPageDto, UnreadNotificationsCountDto } from '@/modules/notifications/dto/notification-inbox-response.dto';
@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService, private readonly config: ConfigService) {}
  private requireEnabled() {
    if (this.config.get<string>('MONITORING_DELIVERY_ENABLED') !== 'true') throw new ServiceUnavailableException('Operational inbox is not enabled');
  }
  findAll(employeeId: string) {
    this.requireEnabled();
    return this.prisma.notification.findMany({ where: { employeeId }, orderBy: { createdAt: 'desc' }, take: 100 });
  }

  async unreadCount(employeeId: string): Promise<UnreadNotificationsCountDto> {
    this.requireEnabled();
    const unreadCount = await this.prisma.notification.count({ where: { employeeId, readAt: null } });
    return { unreadCount };
  }

  async inbox(employeeId: string, query: NotificationInboxQueryDto): Promise<NotificationInboxPageDto> {
    this.requireEnabled();
    const anchor = query.cursor ? await this.prisma.notification.findFirst({
      where: { id: query.cursor, employeeId }, select: { id: true, createdAt: true },
    }) : null;
    // Do not reveal whether another employee owns a supplied cursor.
    if (query.cursor && !anchor) throw new BadRequestException('Referencia de bandeja no válida.');

    const rows = await this.prisma.notification.findMany({
      where: { employeeId, ...(anchor ? { OR: [
        { createdAt: { lt: anchor.createdAt } },
        { createdAt: anchor.createdAt, id: { lt: anchor.id } },
      ] } : {}) },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], take: query.limit + 1,
      select: { id: true, incidentId: true, eventType: true, createdAt: true, readAt: true },
    });
    const page = rows.slice(0, query.limit);
    if (!page.length) return { items: [], nextCursor: null };

    // Batch the page references; Notification currently has no incident foreign key.
    const incidents = await this.prisma.incident.findMany({
      where: { id: { in: [...new Set(page.map((item) => item.incidentId))] } },
      select: { id: true, serviceKey: true, title: true, status: true, severity: true, attentionState: true },
    });
    const summaries = new Map(incidents.map((incident) => [incident.id, incident]));
    return {
      items: page.map((item) => ({ ...item, incident: summaries.get(item.incidentId) ?? null })),
      nextCursor: rows.length > query.limit ? page[page.length - 1].id : null,
    };
  }

  async markRead(employeeId: string, id: string) {
    this.requireEnabled();
    const item = await this.prisma.notification.findFirst({ where: { id, employeeId } });
    if (!item) throw new NotFoundException();
    await this.prisma.notification.updateMany({ where: { id, employeeId, readAt: null }, data: { readAt: new Date() } });
    return { acknowledged: true };
  }
}
