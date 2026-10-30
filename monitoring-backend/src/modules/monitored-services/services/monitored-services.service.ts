import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  OnModuleInit,
  Optional,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { observedService } from '@/modules/service-state/utils/observed-service';
import { readEvaluation } from '@/modules/monitoring/utils/read-evaluation';

import { MonitoredServicesRepository } from '@/modules/monitored-services/repositories/monitored-services.repository';
import type {
  CreateMonitoredServiceDto,
  UpdateMonitoredServiceDto,
} from '@/modules/monitored-services/dto/service-config.dto';
import {
  ServiceStatus,
  type ServiceSnapshot,
} from '@/modules/service-state/interfaces/service-state';

const defaultServices: ServiceSnapshot[] = [
  { id: 'login', name: 'Login', path: '/auth/health' },
  { id: 'balance', name: 'Balance', path: '/accounts/health' },
  { id: 'transfers', name: 'Transfers', path: '/transfers/health' },
].map((service) => ({
  ...service,
  status: ServiceStatus.RECOVERING,
  lastCheckedAt: null,
  latencyMs: null,
  consecutiveFailures: 0,
  consecutiveSuccesses: 0,
  message: 'Awaiting first check',
  criticality: 'HIGH',
  monitoringEnabled: true,
  version: 1,
  pausedReason: null,
  anomalyScore: null,
  riskLevel: null,
}));

@Injectable()
export class MonitoredServicesService implements OnModuleInit {
  private readonly services = new Map<string, ServiceSnapshot>(
    defaultServices.map((service) => [service.id, { ...service }]),
  );

  constructor(
    @Optional() private readonly repository?: MonitoredServicesRepository,
    @Optional() private readonly config?: ConfigService,
  ) {}

  async onModuleInit(): Promise<void> {
    if (!this.repository || this.config?.get<boolean>('app.docsOnly', false)) return;
    await this.repository.loadDefaults(defaultServices);
    await this.refresh();
  }

  private async refresh(): Promise<void> {
    if (!this.repository) return;
    const records = await this.repository.findAll();
    this.services.clear();
    for (const record of records) {
      this.services.set(record.code, {
        id: record.code,
        name: record.name,
        path: record.endpoint,
        status: record.status as ServiceStatus,
        lastCheckedAt: record.lastCheckedAt?.toISOString() ?? null,
        latencyMs: record.lastLatencyMs,
        consecutiveFailures: record.consecutiveFailures,
        consecutiveSuccesses: record.consecutiveSuccesses,
        message: record.lastMessage ?? 'Awaiting first check',
        criticality: record.criticality,
        monitoringEnabled: record.monitoringEnabled,
        version: record.version,
        pausedReason: record.pausedReason,
        anomalyScore: record.anomalyScore,
        riskLevel: record.riskLevel as ServiceSnapshot['riskLevel'],
        evaluation: readEvaluation(record.evaluation),
      });
    }
  }

  findAll(): ServiceSnapshot[] {
    return Array.from(this.services.values());
  }

  observedAll() {
    return this.findAll().map((service) => this.observed(service.id));
  }

  observed(id: string) {
    return observedService(this.require(id), this.config?.get<number>('rules.observationMaxAgeMs', 30_000));
  }

  find(id: string): ServiceSnapshot | undefined {
    return this.services.get(id);
  }

  require(id: string): ServiceSnapshot {
    const service = this.find(id);
    if (!service) throw new NotFoundException('Servicio monitoreado no encontrado');
    return service;
  }

  validateTarget(endpoint: string): { valid: true; endpoint: string } {
    if (!/^\/[a-z][a-z-]*\/health$/.test(endpoint)) {
      throw new BadRequestException(
        'Solo se permiten rutas health de lectura del backend bancario',
      );
    }
    return { valid: true, endpoint };
  }

  async create(input: CreateMonitoredServiceDto, actorId: string): Promise<ServiceSnapshot> {
    if (!this.repository) throw new Error('Persistencia no disponible');
    this.validateTarget(input.endpoint);
    if (this.find(input.code)) throw new ConflictException('El código ya existe');
    await this.repository.create(input, actorId);
    await this.refresh();
    return this.require(input.code);
  }

  async change(
    id: string,
    input: UpdateMonitoredServiceDto,
    actorId: string,
  ): Promise<ServiceSnapshot> {
    if (!this.repository) throw new Error('Persistencia no disponible');
    this.require(id);
    if (input.endpoint !== undefined) this.validateTarget(input.endpoint);
    if (
      input.name === undefined &&
      input.endpoint === undefined &&
      input.criticality === undefined
    ) {
      throw new BadRequestException('Debe modificar al menos un campo de configuración');
    }
    if (!(await this.repository.update(id, input, actorId))) {
      throw new ConflictException('La versión cambió; vuelva a cargar el servicio');
    }
    await this.refresh();
    return this.require(id);
  }

  async setMonitoringEnabled(
    id: string,
    enabled: boolean,
    reason: string,
    actorId: string,
  ): Promise<ServiceSnapshot> {
    if (!this.repository) throw new Error('Persistencia no disponible');
    const current = this.require(id);
    if (current.monitoringEnabled === enabled)
      throw new ConflictException('El servicio ya tiene ese estado de supervisión');
    await this.repository.setMonitoringEnabled(id, enabled, reason, actorId);
    await this.refresh();
    return this.require(id);
  }

  async checks(id: string, limit: number) {
    this.require(id);
    return this.repository?.checks(id, limit) ?? [];
  }

  async stateHistory(id: string, limit: number) {
    this.require(id);
    return this.repository?.stateHistory(id, limit) ?? [];
  }

  async metrics(id: string, limit: number) {
    const checks = await this.checks(id, limit);
    return {
      serviceId: id,
      source: 'persisted-health-checks',
      latencyUnit: 'ms',
      traffic: null,
      points: checks.map((check) => ({
        timestamp: check.checkedAt,
        latencyMs: check.latencyMs,
        reachable: check.reachable,
        timedOut: check.timedOut,
      })),
    };
  }

  instances(id: string) {
    this.require(id);
    return {
      serviceId: id,
      source: 'configured-topology',
      instrumented: false,
      instances: [
        { id: 'app-backend-1', status: 'NO_DATA', lastObservedAt: null },
        { id: 'app-backend-2', status: 'NO_DATA', lastObservedAt: null },
      ],
    };
  }

  async configHistory(id: string, limit: number) {
    this.require(id);
    return this.repository?.configHistory(id, limit) ?? [];
  }

  update(id: string, change: Partial<ServiceSnapshot>): ServiceSnapshot | undefined {
    const item = this.find(id);
    if (item) Object.assign(item, change);
    return item;
  }

  async recordObservation(
    id: string,
    previousStatus: ServiceStatus,
    reachable: boolean,
    timedOut: boolean,
    origin: 'SCHEDULED' | 'MANUAL',
    observation?: ServiceSnapshot,
  ): Promise<void> {
    const snapshot = observation ?? this.find(id);
    if (!snapshot || !this.repository) return;
    await this.repository.recordObservation(
      id,
      previousStatus,
      snapshot,
      reachable,
      timedOut,
      origin,
    );
  }
}
