import { Injectable, ServiceUnavailableException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/common/prisma/prisma.service';
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
  async markRead(employeeId: string, id: string) {
    this.requireEnabled();
    const item = await this.prisma.notification.findFirst({ where: { id, employeeId } });
    if (!item) throw new NotFoundException();
    await this.prisma.notification.updateMany({ where: { id, employeeId, readAt: null }, data: { readAt: new Date() } });
    return { acknowledged: true };
  }
}
