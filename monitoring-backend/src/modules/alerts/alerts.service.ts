import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/database/prisma/prisma.service';
@Injectable()
export class AlertsService {
  constructor(private readonly prisma: PrismaService) {}
  findAll() {
    return this.prisma.alert.findMany({ orderBy: { createdAt: 'desc' }, take: 100 });
  }
}
