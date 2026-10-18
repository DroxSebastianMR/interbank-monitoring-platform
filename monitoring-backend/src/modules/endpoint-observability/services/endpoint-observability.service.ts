import { Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';

import {
  ENDPOINT_CACHE_MS,
  ENDPOINT_FALLBACK_MS,
  ENDPOINT_QUERIES,
  ENDPOINT_REFRESH_MS,
  ENDPOINT_STALE_MS,
} from '@/modules/endpoint-observability/constants/endpoint-observability.constants';
import type {
  EndpointMetricDto,
  EndpointSnapshotDto,
} from '@/modules/endpoint-observability/dto/endpoint-snapshot.dto';
import {
  EndpointTrafficState,
  TelemetryState,
} from '@/modules/endpoint-observability/enums/endpoint-state.enum';
import { EndpointPrometheusService } from '@/modules/endpoint-observability/services/endpoint-prometheus.service';
import type { PrometheusSample } from '@/modules/endpoint-observability/types/prometheus-vector.type';

const keyOf = (labels: Record<string, string>): string =>
  JSON.stringify([labels.instance, labels.module, labels.method, labels.route]);
const numeric = (sample: PrometheusSample): number | null => {
  const value = Number(sample.value[1]);
  return Number.isFinite(value) && value >= 0 ? value : null;
};
const index = (samples: PrometheusSample[]): Map<string, number | null> =>
  new Map(samples.map((sample) => [keyOf(sample.metric), numeric(sample)]));

@Injectable()
export class EndpointObservabilityService {
  private cached?: { at: number; value: EndpointSnapshotDto };
  private lastGood?: { at: number; value: EndpointSnapshotDto };
  private pending?: Promise<EndpointSnapshotDto>;

  constructor(private readonly prometheus: EndpointPrometheusService) {}

  snapshot(): Promise<EndpointSnapshotDto> {
    if (this.cached && Date.now() - this.cached.at < ENDPOINT_CACHE_MS)
      return Promise.resolve(this.cached.value);
    if (this.pending) return this.pending;
    this.pending = this.refresh().finally(() => {
      this.pending = undefined;
    });
    return this.pending;
  }

  private async refresh(): Promise<EndpointSnapshotDto> {
    const now = Date.now();
    let result: EndpointSnapshotDto;
    try {
      result = await this.collect(now);
      this.lastGood = { at: now, value: result };
    } catch {
      const previous =
        this.lastGood && now - this.lastGood.at <= ENDPOINT_FALLBACK_MS
          ? this.lastGood.value
          : undefined;
      result = {
        sourceState: previous ? TelemetryState.STALE : TelemetryState.UNAVAILABLE,
        generatedAt: new Date(now).toISOString(),
        lastSuccessAt: this.lastGood?.value.generatedAt ?? null,
        refreshIntervalMs: ENDPOINT_REFRESH_MS,
        windowSeconds: 120,
        instances:
          previous?.instances.map((instance) => ({ ...instance, state: TelemetryState.STALE })) ??
          [],
        endpoints:
          previous?.endpoints.map((endpoint) => ({
            ...endpoint,
            state: TelemetryState.STALE,
            traffic: EndpointTrafficState.UNKNOWN,
            requestRateHz: null,
            clientErrorRateHz: null,
            serverErrorRateHz: null,
            latencyP95Ms: null,
            latencyP50Ms: null,
            latencyP99Ms: null,
            observedRequests: null,
          })) ?? [],
      };
    }
    this.cached = { at: Date.now(), value: result };
    return result;
  }

  private async collect(now: number): Promise<EndpointSnapshotDto> {
    const [catalog, up, scrapedAt, total, rate, clientErrors, serverErrors, p95, p50, p99] =
      await Promise.all(
        Object.values(ENDPOINT_QUERIES).map((query) => this.prometheus.query(query, now / 1_000)),
      );
    const timestamps = new Map(
      scrapedAt.map((sample) => [sample.metric.instance, numeric(sample)]),
    );
    const availability = new Map(up.map((sample) => [sample.metric.instance, numeric(sample)]));
    const rates = index(rate),
      totals = index(total),
      clients = index(clientErrors),
      servers = index(serverErrors),
      latencies = index(p95);
    const medians = index(p50),
      tails = index(p99);
    const ids = new Set(
      [...availability.keys(), ...catalog.map((sample) => sample.metric.instance)].filter(Boolean),
    );
    const instances = [...ids].sort().map((id) => {
      const seconds = timestamps.get(id);
      const age = seconds == null ? null : now - seconds * 1_000;
      const state =
        age === null
          ? TelemetryState.UNKNOWN
          : age > ENDPOINT_STALE_MS || age < -5_000
            ? TelemetryState.STALE
            : availability.get(id) === 1
              ? TelemetryState.AVAILABLE
              : availability.get(id) === 0
                ? TelemetryState.UNAVAILABLE
                : TelemetryState.UNKNOWN;
      return {
        id,
        state,
        observedAt: seconds == null ? null : new Date(seconds * 1_000).toISOString(),
        endpointCount: 0,
      };
    });
    const instanceMap = new Map(instances.map((instance) => [instance.id, instance]));
    const endpoints: EndpointMetricDto[] = [];
    const seen = new Set<string>();
    for (const sample of catalog) {
      const { instance, module, method, route } = sample.metric;
      const key = keyOf(sample.metric);
      const target = instanceMap.get(instance);
      if (
        !target ||
        !module ||
        !route?.startsWith('/') ||
        !/^(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS|TRACE)$/.test(method) ||
        seen.has(key)
      )
        continue;
      seen.add(key);
      target.endpointCount++;
      const measured = route !== '/metrics';
      const current = target.state === TelemetryState.AVAILABLE && measured;
      const requests = current ? (totals.get(key) ?? 0) : null;
      const hz = current ? (rates.get(key) ?? null) : null;
      const traffic = !measured
        ? EndpointTrafficState.NOT_MEASURED
        : !current
          ? EndpointTrafficState.UNKNOWN
          : hz === null && requests
            ? EndpointTrafficState.WARMING_UP
            : hz !== null && hz > 0
              ? EndpointTrafficState.OBSERVED
              : EndpointTrafficState.NO_TRAFFIC;
      endpoints.push({
        operationId: createHash('sha256')
          .update(`interbank-app:${method}:${route}`)
          .digest('hex')
          .slice(0, 24),
        application: 'interbank-app',
        version: route.match(/^\/v(\d+)(?:\/|$)/)?.[1] ?? 'unversioned',
        controlPolicy: 'OBSERVE_ONLY',
        instance,
        module,
        method,
        route,
        state: target.state,
        traffic,
        observedAt: target.observedAt,
        observedRequests: requests,
        requestRateHz: hz ?? (current && requests === 0 ? 0 : null),
        clientErrorRateHz: current && hz !== null ? (clients.get(key) ?? 0) : null,
        serverErrorRateHz: current && hz !== null ? (servers.get(key) ?? 0) : null,
        latencyP95Ms:
          current && hz !== null && hz > 0 && latencies.get(key) != null
            ? latencies.get(key)! * 1_000
            : null,
        latencyP50Ms:
          current && hz !== null && hz > 0 && medians.get(key) != null
            ? medians.get(key)! * 1000
            : null,
        latencyP99Ms:
          current && hz !== null && hz > 0 && tails.get(key) != null
            ? tails.get(key)! * 1000
            : null,
      });
    }
    endpoints.sort(
      (a, b) =>
        a.module.localeCompare(b.module) ||
        a.route.localeCompare(b.route) ||
        a.method.localeCompare(b.method) ||
        a.instance.localeCompare(b.instance),
    );
    return {
      sourceState: TelemetryState.AVAILABLE,
      generatedAt: new Date(now).toISOString(),
      lastSuccessAt: new Date(now).toISOString(),
      refreshIntervalMs: ENDPOINT_REFRESH_MS,
      windowSeconds: 120,
      instances,
      endpoints,
    };
  }
}
