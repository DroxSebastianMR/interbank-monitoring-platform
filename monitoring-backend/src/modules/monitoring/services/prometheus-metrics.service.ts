import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

interface PrometheusSample {
  metric: Record<string, string>;
  value: [number, string];
}

interface PrometheusResponse {
  status: string;
  data: { result: PrometheusSample[] };
}

export interface TrafficMetrics {
  requestRate: number;
  errorRate: number;
  latencyP95Ms: number;
}

export interface InfrastructureInstanceTelemetry {
  id: string;
  reachable: boolean;
  observedAt: string;
  requestRateHz: number;
  errorRate: number | null;
  latencyP95Ms: number | null;
}

export interface InfrastructureGatewayTelemetry {
  reachable: boolean;
  observedAt: string;
  latencyMs: number;
}

export interface InfrastructureTelemetry {
  gateway: InfrastructureGatewayTelemetry;
  instances: InfrastructureInstanceTelemetry[];
}

const metricService: Record<string, string> = {
  login: 'auth',
  balance: 'accounts',
  transfers: 'transfers',
};

@Injectable()
export class PrometheusMetricsService {
  private readonly logger = new Logger(PrometheusMetricsService.name);
  private readonly baseUrl: string;
  private readonly appBackendUrl: string;
  private lastWarningAt = 0;

  constructor(
    private readonly http: HttpService,
    config: ConfigService,
  ) {
    this.baseUrl = config.get<string>('integrations.prometheusUrl', 'http://localhost:9090');
    this.appBackendUrl = config
      .get<string>('integrations.appBackendUrl', 'http://localhost:8080')
      .replace(/\/$/, '');
  }

  async read(serviceId: string): Promise<TrafficMetrics | null> {
    const service = metricService[serviceId];
    if (!service) return null;
    const selector = `{service="${service}"}`;
    const total = `sum(rate(interbank_app_http_requests_total${selector}[1m]))`;
    const errors = `sum(rate(interbank_app_http_requests_total{service="${service}",status_code=~"5.."}[1m]))`;
    const latency = `histogram_quantile(0.95, sum by (le) (rate(interbank_app_http_request_duration_seconds_bucket${selector}[1m]))) * 1000`;
    try {
      const [requestRate, errorRatePerSecond, latencyP95Ms] = await Promise.all([
        this.query(total),
        this.query(errors),
        this.query(latency),
      ]);
      if (requestRate === null || requestRate <= 0) return null;
      return {
        requestRate,
        errorRate: Math.min(1, Math.max(0, (errorRatePerSecond ?? 0) / requestRate)),
        latencyP95Ms: latencyP95Ms ?? 0,
      };
    } catch (error) {
      this.warnUnavailable(error);
      return null;
    }
  }

  async readInfrastructure(instanceIds: string[]): Promise<InfrastructureTelemetry> {
    const [gateway, instances] = await Promise.all([
      this.probeGateway(),
      this.readInstances(instanceIds),
    ]);
    return { gateway, instances };
  }

  private async probeGateway(): Promise<InfrastructureGatewayTelemetry> {
    const observedAt = new Date().toISOString();
    const started = performance.now();
    try {
      await firstValueFrom(this.http.get(`${this.appBackendUrl}/health`, { timeout: 800 }));
      return {
        reachable: true,
        observedAt,
        latencyMs: Math.max(0, Math.round(performance.now() - started)),
      };
    } catch {
      return {
        reachable: false,
        observedAt,
        latencyMs: Math.max(0, Math.round(performance.now() - started)),
      };
    }
  }

  private async readInstances(instanceIds: string[]): Promise<InfrastructureInstanceTelemetry[]> {
    try {
      const up = await this.queryVector('up{job="app-backend"}');
      const [rates, errors, latencies] = await Promise.all([
        this.queryVector('sum by (instance) (rate(interbank_app_http_requests_total[1m]))').catch(
          () => [],
        ),
        this.queryVector(
          'sum by (instance) (rate(interbank_app_http_requests_total{status_code=~"5.."}[1m]))',
        ).catch(() => []),
        this.queryVector(
          'histogram_quantile(0.95, sum by (instance, le) (rate(interbank_app_http_request_duration_seconds_bucket[1m]))) * 1000',
        ).catch(() => []),
      ]);
      const upById = this.samplesByInstance(up);
      const ratesById = this.samplesByInstance(rates);
      const errorsById = this.samplesByInstance(errors);
      const latenciesById = this.samplesByInstance(latencies);

      return instanceIds.flatMap((id) => {
        const availability = upById.get(id);
        if (!availability) return [];
        const requestRateHz = this.sampleValue(ratesById.get(id)) ?? 0;
        const errorsPerSecond = this.sampleValue(errorsById.get(id)) ?? 0;
        return [
          {
            id,
            reachable: this.sampleValue(availability) === 1,
            observedAt: new Date(availability.value[0] * 1_000).toISOString(),
            requestRateHz,
            errorRate:
              requestRateHz > 0 ? Math.min(1, Math.max(0, errorsPerSecond / requestRateHz)) : null,
            latencyP95Ms: this.sampleValue(latenciesById.get(id)),
          },
        ];
      });
    } catch (error) {
      this.warnUnavailable(error);
      return [];
    }
  }

  private samplesByInstance(samples: PrometheusSample[]): Map<string, PrometheusSample> {
    return new Map(
      samples.map((sample) => [this.normalizeInstance(sample.metric.instance), sample]),
    );
  }

  private normalizeInstance(instance?: string): string {
    return instance?.split(':')[0] ?? '';
  }

  private sampleValue(sample?: PrometheusSample): number | null {
    if (!sample) return null;
    const value = Number(sample.value[1]);
    return Number.isFinite(value) ? value : null;
  }

  private async query(expression: string): Promise<number | null> {
    const result = await this.queryVector(expression);
    return this.sampleValue(result[0]);
  }

  private async queryVector(expression: string): Promise<PrometheusSample[]> {
    const response = await firstValueFrom(
      this.http.get<PrometheusResponse>(`${this.baseUrl}/api/v1/query`, {
        params: { query: expression },
        timeout: 800,
      }),
    );
    return response.data.status === 'success' ? response.data.data.result : [];
  }

  private warnUnavailable(error: unknown): void {
    if (Date.now() - this.lastWarningAt <= 60_000) return;
    this.lastWarningAt = Date.now();
    this.logger.warn(
      `Prometheus metrics unavailable: ${error instanceof Error ? error.message : 'unknown error'}`,
    );
  }
}
