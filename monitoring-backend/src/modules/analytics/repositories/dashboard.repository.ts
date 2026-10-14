import { Injectable } from '@nestjs/common';

import { PrismaService } from '@/common/prisma/prisma.service';

@Injectable()
export class DashboardRepository {
  constructor(private readonly prisma: PrismaService) {}

  async snapshot(since: Date) {
    const [checks, incidents, alerts, activeIncidentsCount, activeAlertsCount] = await Promise.all([
      this.prisma.healthCheck.findMany({
        where: { checkedAt: { gte: since } },
        orderBy: { checkedAt: 'desc' },
        take: 5000,
        select: {
          status: true,
          latencyMs: true,
          reachable: true,
          checkedAt: true,
          service: { select: { code: true } },
        },
      }),
      this.prisma.incident.findMany({
        where: { resolvedAt: null },
        orderBy: { openedAt: 'desc' },
        take: 10,
        select: { id: true, serviceKey: true, title: true, severity: true, openedAt: true },
      }),
      this.prisma.alert.findMany({
        where: { incident: { resolvedAt: null } },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: { id: true, message: true, createdAt: true },
      }),
      this.prisma.incident.count({ where: { resolvedAt: null } }),
      this.prisma.alert.count({ where: { incident: { resolvedAt: null } } }),
    ]);
    return { checks, incidents, alerts, activeIncidentsCount, activeAlertsCount };
  }

  checks(from: Date, to: Date, serviceId?: string) {
    return this.prisma.healthCheck.findMany({
      where: {
        checkedAt: { gte: from, lte: to },
        ...(serviceId ? { service: { code: serviceId } } : {}),
      },
      orderBy: { checkedAt: 'desc' },
      take: 5000,
      select: {
        checkedAt: true,
        latencyMs: true,
        reachable: true,
        timedOut: true,
        status: true,
        service: { select: { code: true } },
      },
    });
  }

  async activity(limit: number) {
    const [incidents, alerts] = await Promise.all([
      this.prisma.incident.findMany({
        orderBy: { openedAt: 'desc' },
        take: limit,
        select: { id: true, serviceKey: true, title: true, severity: true, openedAt: true },
      }),
      this.prisma.alert.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: {
          id: true,
          message: true,
          createdAt: true,
          incident: { select: { serviceKey: true } },
        },
      }),
    ]);
    return { incidents, alerts };
  }
}
