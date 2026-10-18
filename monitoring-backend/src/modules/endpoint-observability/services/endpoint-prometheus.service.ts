import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

import {
  ENDPOINT_MAX_SAMPLES,
  ENDPOINT_QUERY_TIMEOUT_MS,
} from '@/modules/endpoint-observability/constants/endpoint-observability.constants';
import type { PrometheusSample } from '@/modules/endpoint-observability/types/prometheus-vector.type';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

@Injectable()
export class EndpointPrometheusService {
  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {}

  async query(query: string, time: number): Promise<PrometheusSample[]> {
    // Only server-owned PromQL and configured upstream URLs; no URL/query from the caller.
    const baseUrl = this.config.getOrThrow<string>('integrations.prometheusUrl').replace(/\/$/, '');
    const response = await firstValueFrom(
      this.http.get<unknown>(`${baseUrl}/api/v1/query`, {
        params: { query, time },
        timeout: ENDPOINT_QUERY_TIMEOUT_MS,
        maxContentLength: 5_000_000,
        maxRedirects: 0,
      }),
    );
    const body = response.data;
    if (
      !isRecord(body) ||
      body.status !== 'success' ||
      !isRecord(body.data) ||
      body.data.resultType !== 'vector' ||
      !Array.isArray(body.data.result) ||
      body.data.result.length > ENDPOINT_MAX_SAMPLES
    ) {
      throw new Error('Invalid endpoint telemetry response');
    }
    const samples: PrometheusSample[] = [];
    for (const value of body.data.result as unknown[]) {
      if (
        !isRecord(value) ||
        !isRecord(value.metric) ||
        !Array.isArray(value.value) ||
        value.value.length !== 2 ||
        typeof value.value[0] !== 'number' ||
        typeof value.value[1] !== 'string'
      )
        throw new Error('Invalid telemetry sample');
      const metric: Record<string, string> = {};
      for (const [key, label] of Object.entries(value.metric)) {
        if (typeof label !== 'string' || label.length > 512)
          throw new Error('Invalid telemetry label');
        metric[key] = label;
      }
      samples.push({ metric, value: [value.value[0], value.value[1]] });
    }
    return samples;
  }
}
