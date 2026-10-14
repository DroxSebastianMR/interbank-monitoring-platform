import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

interface PrometheusResponse {
  status: string;
  data: { result: Array<{ value: [number, string] }> };
}

export interface TrafficMetrics {
  requestRate: number;
  errorRate: number;
  latencyP95Ms: number;
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
  private lastWarningAt = 0;

  constructor(http: HttpService, config: ConfigService) {
    this.http = http;
    this.baseUrl = config.get<string>('integrations.prometheusUrl', 'http://localhost:9090');
  }

  private readonly http: HttpService;

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
      if (Date.now() - this.lastWarningAt > 60_000) {
        this.lastWarningAt = Date.now();
        this.logger.warn(
          `Prometheus metrics unavailable: ${error instanceof Error ? error.message : 'unknown error'}`,
        );
      }
      return null;
    }
  }

  private async query(expression: string): Promise<number | null> {
    const response = await firstValueFrom(
      this.http.get<PrometheusResponse>(`${this.baseUrl}/api/v1/query`, {
        params: { query: expression },
        timeout: 800,
      }),
    );
    const raw = response.data.data.result[0]?.value[1];
    if (response.data.status !== 'success' || raw === undefined) return null;
    const value = Number(raw);
    return Number.isFinite(value) ? value : null;
  }
}
