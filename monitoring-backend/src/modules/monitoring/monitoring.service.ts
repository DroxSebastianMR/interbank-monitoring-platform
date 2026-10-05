import { HttpService } from '@nestjs/axios';
import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { DetectionService } from '../detection/detection.service';
import { MonitoredServicesService } from '../monitored-services/monitored-services.service';
import { ServiceStateService } from '../service-state/service-state.service';
@Injectable()
export class MonitoringService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MonitoringService.name);
  private timer?: NodeJS.Timeout;
  private readonly baseUrl: string;
  private readonly timeout: number;
  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
    private readonly services: MonitoredServicesService,
    private readonly detection: DetectionService,
    private readonly states: ServiceStateService,
  ) {
    this.baseUrl = config.get<string>('appBackendUrl', 'http://localhost:8080');
    this.timeout = config.get<number>('monitor.timeoutMs', 3000);
  }
  onModuleInit() {
    void this.runAll();
    this.timer = setInterval(
      () => void this.runAll(),
      this.config.get<number>('monitor.intervalMs', 10000),
    );
  }
  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }
  async runAll() {
    return Promise.all(this.services.findAll().map((s) => this.check(s.id)));
  }
  async check(id: string) {
    const service = this.services.find(id);
    if (!service) return;
    const started = Date.now();
    let reachable = false;
    let message = 'Healthy';
    try {
      await firstValueFrom(
        this.http.get(`${this.baseUrl}${service.path}`, { timeout: this.timeout }),
      );
      reachable = true;
    } catch (error) {
      message = error instanceof Error ? error.message : 'Health check failed';
    }
    const latency = Date.now() - started;
    const failures = reachable ? 0 : service.consecutiveFailures + 1;
    const detection = this.detection.analyze({
      latency,
      errorRate: reachable ? 0 : 1,
      timeoutRate: reachable ? 0 : 1,
      availability: reachable ? 1 : 0,
      requestRate: 0,
      healthCheckFailures: failures,
      aiAnomalyScore: 0,
    });
    const status = this.states.decide(service.status, detection, reachable);
    this.services.update(id, {
      status,
      lastCheckedAt: new Date().toISOString(),
      latencyMs: latency,
      consecutiveFailures: failures,
      message,
    });
    this.logger.log(
      `Health check completed: service=${id}, status=${status}, latency=${latency}ms`,
    );
    return this.services.find(id);
  }
}
