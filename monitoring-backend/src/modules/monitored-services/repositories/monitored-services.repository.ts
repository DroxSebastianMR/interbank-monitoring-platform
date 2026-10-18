import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '@/common/prisma/prisma.service';
import type {
  CreateMonitoredServiceDto,
  UpdateMonitoredServiceDto,
} from '@/modules/monitored-services/dto/service-config.dto';
import type { ServiceSnapshot } from '@/modules/service-state/interfaces/service-state';
import type { ServiceStatus } from '@/modules/service-state/interfaces/service-state';

@Injectable()
export class MonitoredServicesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async loadDefaults(
    defaults: Array<Pick<ServiceSnapshot, 'id' | 'name' | 'path'>>,
  ): Promise<void> {
    for (const service of defaults) {
      await this.prisma.monitoredService.upsert({
        where: { code: service.id },
        create: { code: service.id, name: service.name, endpoint: service.path },
        update: {},
      });
    }
  }

  findAll() {
    return this.prisma.monitoredService.findMany({ orderBy: { code: 'asc' } });
  }

  find(code: string) {
    return this.prisma.monitoredService.findUnique({ where: { code } });
  }

  checks(code: string, take: number) {
    return this.prisma.healthCheck.findMany({
      where: { service: { code } },
      orderBy: { checkedAt: 'desc' },
      take,
    });
  }

  stateHistory(code: string, take: number) {
    return this.prisma.serviceStateChange.findMany({
      where: { service: { code } },
      orderBy: { changedAt: 'desc' },
      take,
    });
  }

  configHistory(code: string, take: number) {
    return this.prisma.auditLog.findMany({
      where: { resource: 'monitored-service', resourceId: code },
      orderBy: { createdAt: 'desc' },
      take,
      select: { id: true, action: true, actorId: true, createdAt: true, metadata: true },
    });
  }

  async create(input: CreateMonitoredServiceDto, actorId: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.monitoredService.create({
        data: {
          code: input.code,
          name: input.name,
          endpoint: input.endpoint,
          criticality: input.criticality,
        },
      });
      await tx.auditLog.create({
        data: {
          actorId,
          action: 'SERVICE_CREATED',
          resource: 'monitored-service',
          resourceId: input.code,
          outcome: 'SUCCESS',
          metadata: { name: input.name, endpoint: input.endpoint, criticality: input.criticality },
        },
      });
    });
  }

  async update(code: string, input: UpdateMonitoredServiceDto, actorId: string): Promise<boolean> {
    return this.prisma.$transaction(async (tx) => {
      const result = await tx.monitoredService.updateMany({
        where: { code, version: input.expectedVersion },
        data: {
          ...(input.name === undefined ? {} : { name: input.name }),
          ...(input.endpoint === undefined ? {} : { endpoint: input.endpoint }),
          ...(input.criticality === undefined ? {} : { criticality: input.criticality }),
          version: { increment: 1 },
        },
      });
      if (result.count === 0) return false;
      await tx.auditLog.create({
        data: {
          actorId,
          action: 'SERVICE_UPDATED',
          resource: 'monitored-service',
          resourceId: code,
          outcome: 'SUCCESS',
          metadata: {
            reason: input.reason,
            expectedVersion: input.expectedVersion,
            name: input.name,
            endpoint: input.endpoint,
            criticality: input.criticality,
          },
        },
      });
      return true;
    });
  }

  async setMonitoringEnabled(
    code: string,
    enabled: boolean,
    reason: string,
    actorId: string,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.monitoredService.update({
        where: { code },
        data: {
          monitoringEnabled: enabled,
          pausedReason: enabled ? null : reason,
          version: { increment: 1 },
        },
      });
      await tx.auditLog.create({
        data: {
          actorId,
          action: enabled ? 'SERVICE_RESUMED' : 'SERVICE_PAUSED',
          resource: 'monitored-service',
          resourceId: code,
          outcome: 'SUCCESS',
          metadata: { reason },
        },
      });
    });
  }

  async recordObservation(
    code: string,
    previousStatus: ServiceStatus,
    snapshot: ServiceSnapshot,
    reachable: boolean,
    timedOut: boolean,
    origin: 'SCHEDULED' | 'MANUAL',
  ): Promise<void> {
    const service = await this.prisma.monitoredService.findUniqueOrThrow({
      where: { code },
      select: { id: true },
    });
    const updateService = this.prisma.monitoredService.update({
      where: { code },
      data: {
        status: snapshot.status,
        lastCheckedAt: snapshot.lastCheckedAt ? new Date(snapshot.lastCheckedAt) : null,
        lastLatencyMs: snapshot.latencyMs,
        lastMessage: snapshot.message,
        anomalyScore: snapshot.anomalyScore,
        riskLevel: snapshot.riskLevel,
        consecutiveFailures: snapshot.consecutiveFailures,
        consecutiveSuccesses: snapshot.consecutiveSuccesses ?? 0,
      },
    });
    const createHealthCheck = this.prisma.healthCheck.create({
      data: {
        serviceId: service.id,
        status: snapshot.status,
        latencyMs: snapshot.latencyMs ?? 0,
        reachable,
        timedOut,
        message: snapshot.message,
        origin,
        checkedAt: snapshot.lastCheckedAt ? new Date(snapshot.lastCheckedAt) : new Date(),
      },
    });

    if (previousStatus === snapshot.status) {
      await this.prisma.$transaction([updateService, createHealthCheck], {
        isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
      });
      return;
    }

    await this.prisma.$transaction(
      [
        updateService,
        createHealthCheck,
        this.prisma.serviceStateChange.create({
          data: {
            serviceId: service.id,
            fromStatus: previousStatus,
            toStatus: snapshot.status,
            reason: snapshot.message,
          },
        }),
      ],
      { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted },
    );
  }
}
