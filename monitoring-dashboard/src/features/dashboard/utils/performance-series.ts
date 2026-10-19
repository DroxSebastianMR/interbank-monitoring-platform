import type { MetricSeries } from "@/features/dashboard/types/dashboard.types";
import type { OverviewPeriod } from "@/features/dashboard/types/overview-filters.types";
import { MIN_INDICATOR_SAMPLES } from "@/features/dashboard/utils/indicator-metrics";

export const PERFORMANCE_METRICS = [
  { value: "latency-p95", label: "Latencia p95 · sondas", unit: "ms" },
  { value: "http-errors", label: "Tasa de errores · HTTP", unit: "%" },
  {
    value: "http-rps",
    label: "Solicitudes por segundo · HTTP",
    unit: "solicitudes/s",
  },
] as const;
export type PerformanceMetric = (typeof PERFORMANCE_METRICS)[number]["value"];
export interface PerformanceBucket {
  from: number;
  to: number;
  at: number;
  value: number | null;
  count: number;
  missing: boolean;
  partial: boolean;
}
export interface PerformanceLine {
  serviceId: string;
  buckets: PerformanceBucket[];
}
const BUCKET_MS: Record<OverviewPeriod, number> = {
  "15m": 300_000,
  "1h": 300_000,
  "6h": 1_800_000,
  "24h": 7_200_000,
};

/** Aggregate only persisted probe observations. Empty/insufficient buckets remain null. */
export function buildPerformanceSeries(
  series: MetricSeries | undefined,
  serviceIds: string[],
  period: OverviewPeriod,
) {
  const from = Date.parse(series?.from ?? "");
  const to = Date.parse(series?.to ?? "");
  if (
    !series ||
    series.source !== "persisted-health-checks" ||
    series.metric !== "latency" ||
    series.unit !== "ms" ||
    !Number.isFinite(from) ||
    !Number.isFinite(to) ||
    to <= from
  )
    return null;
  const step = BUCKET_MS[period];
  const oldest = Math.min(
    ...series.points
      .map((point) => Date.parse(point.timestamp))
      .filter(Number.isFinite),
  );
  const start = Math.floor(from / step) * step;
  const lines: PerformanceLine[] = serviceIds.map((serviceId) => {
    const samples = series.points.filter(
      (point) =>
        point.serviceId === serviceId &&
        Number.isFinite(point.value) &&
        point.value >= 0 &&
        Date.parse(point.timestamp) >= from &&
        Date.parse(point.timestamp) < to,
    );
    const buckets: PerformanceBucket[] = [];
    for (let cursor = start; cursor < to; cursor += step) {
      const left = Math.max(cursor, from);
      const right = Math.min(cursor + step, to);
      const values = samples
        .filter((point) => {
          const time = Date.parse(point.timestamp);
          return time >= left && time < right;
        })
        .map((point) => point.value)
        .sort((a, b) => a - b);
      const partial = series.truncated && left <= oldest && right >= oldest;
      buckets.push({
        from: left,
        to: right,
        at: left + (right - left) / 2,
        value:
          !partial && values.length >= MIN_INDICATOR_SAMPLES
            ? values[Math.ceil(values.length * 0.95) - 1]
            : null,
        count: values.length,
        missing: values.length === 0,
        partial,
      });
    }
    return { serviceId, buckets };
  });
  return { from, to, step, lines, truncated: series.truncated };
}
