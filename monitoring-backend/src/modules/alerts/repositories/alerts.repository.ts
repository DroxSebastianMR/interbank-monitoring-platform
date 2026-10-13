import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';

@Injectable()
export class AlertsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findRecent() {
    return this.prisma.alert.findMany({ orderBy: { createdAt: 'desc' }, take: 100 });
  }
}
