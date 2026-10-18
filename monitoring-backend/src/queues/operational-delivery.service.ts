import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue, Worker, type Job } from 'bullmq';
import { PrismaService } from '@/common/prisma/prisma.service';

const QUEUE = 'monitor-operational-inbox-v1';
interface DeliveryJob { eventId: string }

@Injectable()
export class OperationalDeliveryService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OperationalDeliveryService.name);
  private queue?: Queue<DeliveryJob>;
  private worker?: Worker<DeliveryJob>;
  private timer?: NodeJS.Timeout;
  private dispatching?: Promise<void>;
  constructor(private readonly prisma: PrismaService, private readonly config: ConfigService) {}
  onModuleInit() {
    if (this.config.get<boolean>('app.docsOnly', false) || this.config.get<string>('MONITORING_DELIVERY_ENABLED') !== 'true') return;
    const connection = { host: this.config.get<string>('redis.host', 'localhost'), port: this.config.get<number>('redis.port', 6379) };
    this.queue = new Queue<DeliveryJob>(QUEUE, { connection: { ...connection, maxRetriesPerRequest: 1 }, defaultJobOptions: { attempts: 5, backoff: { type: 'exponential', delay: 1000 }, removeOnComplete: { age: 86400, count: 10000 }, removeOnFail: { age: 604800, count: 10000 } } });
    this.worker = new Worker<DeliveryJob>(QUEUE, (job) => this.deliver(job.data.eventId), { connection: { ...connection, maxRetriesPerRequest: null }, concurrency: 2, lockDuration: 30000 });
    this.queue.on('error', () => this.logger.warn('Operational queue unavailable; outbox remains durable'));
    this.worker.on('error', () => this.logger.warn('Operational worker transport unavailable'));
    this.worker.on('failed', (job: Job<DeliveryJob> | undefined) => {
      if (job) void this.prisma.operationalOutbox.updateMany({ where: { id: job.data.eventId, processedAt: null }, data: { attempts: job.attemptsMade, lastError: 'DELIVERY_FAILED' } }).catch(() => this.logger.warn('Could not record failed delivery'));
    });
    this.timer = setInterval(() => { void this.dispatch().catch(() => this.logger.warn('Outbox dispatch unavailable')); }, 2000);
    this.timer.unref();
  }
  dispatch(): Promise<void> {
    if (this.dispatching) return this.dispatching;
    this.dispatching = this.enqueuePending().finally(() => { this.dispatching = undefined; });
    return this.dispatching;
  }
  private async enqueuePending(): Promise<void> {
    if (!this.queue) return;
    const rows = await this.prisma.operationalOutbox.findMany({ where: { processedAt: null, attempts: { lt: 5 }, OR: [{ queuedAt: null }, { queuedAt: { lt: new Date(Date.now() - 60000) } }] }, orderBy: { createdAt: 'asc' }, take: 25 });
    for (const row of rows) {
      await this.queue.add('deliver-inbox', { eventId: row.id }, { jobId: row.id });
      await this.prisma.operationalOutbox.update({ where: { id: row.id }, data: { queuedAt: new Date() } });
    }
  }
  async deliver(eventId: string): Promise<void> {
    const event = await this.prisma.operationalOutbox.findUnique({ where: { id: eventId } });
    if (!event || event.processedAt) return;
    let cursor: string | undefined;
    for (;;) {
      const employees = await this.prisma.employee.findMany({ where: { status: 'ACTIVE', AND: ['incidents.read', 'notifications.read'].map((code) => ({ roles: { some: { role: { permissions: { some: { permission: { code } } } } } } })) }, select: { id: true }, orderBy: { id: 'asc' }, take: 100, ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}) });
      if (!employees.length) break;
      await this.prisma.notification.createMany({ data: employees.map(({ id }) => ({ employeeId: id, eventId, incidentId: event.incidentId, eventType: event.eventType })), skipDuplicates: true });
      cursor = employees[employees.length - 1].id;
    }
    // Crash after insert but before this update is harmless: unique(employee,event) deduplicates.
    await this.prisma.operationalOutbox.update({ where: { id: eventId }, data: { processedAt: new Date(), lastError: null } });
  }
  async onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
    await this.dispatching?.catch(() => undefined);
    await this.worker?.close();
    await this.queue?.close();
  }
}
