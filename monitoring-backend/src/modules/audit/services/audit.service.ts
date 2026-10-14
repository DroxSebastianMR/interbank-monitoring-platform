import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  findRecent(limit: number) {
    return this.prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        actorId: true,
        action: true,
        resource: true,
        resourceId: true,
        outcome: true,
        createdAt: true,
      },
    });
  }
}
