import type { MetricSeries } from "@/features/dashboard/types/dashboard.types";
import type { EndpointSnapshot } from "@/features/endpoints/types/endpoint.types";

// Display-quality guard, not an availability SLO or a statistical confidence interval.
export const MIN_INDICATOR_SAMPLES = 20;
const MIN_SPAN_RATIO = 0.8;
const MAX_GAP_RATIO = 0.1;

export function summarizeProbes(
  series: MetricSeries | undefined,
  serviceIds: string[],
  metric: "latency" | "availability",
) {
  const from = Date.parse(series?.from ?? "");
  const to = Date.parse(series?.to ?? "");
  const valid =
    series?.source === "persisted-health-checks" &&
    series.metric === metric &&
    series.unit === (metric === "latency" ? "ms" : "ratio") &&
    Number.isFinite(from) &&
    to > from;
  const points = valid
    ? series!.points.filter((point) => {
        const time = Date.parse(point.timestamp);
        return (
          serviceIds.includes(point.serviceId) &&
          time >= from &&
          time <= to &&
          Number.isFinite(point.value) &&
          (metric === "availability"
            ? point.value === 0 || point.value === 1
            : point.value >= 0)
        );
      })
    : [];
  const rows = serviceIds.map((id) => {
    const samples = points
      .filter((point) => point.serviceId === id)
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    const times = samples.map((point) => Date.parse(point.timestamp));
    const span = times.length > 1 ? times[times.length - 1] - times[0] : 0;
    const spanRatio = valid ? span / (to - from) : 0;
    const edges = [from, ...times, to];
    const maxGap = times.length
      ? Math.max(...edges.slice(1).map((time, index) => time - edges[index]))
      : Infinity;
    const sufficient =
      !!valid &&
      !series!.truncated &&
      samples.length >= MIN_INDICATOR_SAMPLES &&
      spanRatio >= MIN_SPAN_RATIO &&
      maxGap <= Math.max(30_000, (to - from) * MAX_GAP_RATIO);
    return { id, count: samples.length, spanRatio, sufficient };
  });
  const sufficient = rows.length > 0 && rows.every((row) => row.sufficient);
  const values = points.map((point) => point.value).sort((a, b) => a - b);
  const value =
    sufficient && values.length
      ? metric === "latency"
        ? values[Math.ceil(values.length * 0.95) - 1]
        : values.reduce((sum, item) => sum + item, 0) / values.length
      : null;
  return {
    value,
    rows,
    count: points.length,
    sufficient,
    truncated: !!series?.truncated,
    from,
    to,
  };
}

export function summarizeHttpErrors(
  snapshot: EndpointSnapshot | undefined,
  now: number,
) {
  if (
    !snapshot ||
    snapshot.sourceState !== "AVAILABLE" ||
    now - Date.parse(snapshot.generatedAt) > 30_000 ||
    Date.parse(snapshot.generatedAt) > now
  )
    return null;
  const instrumented = snapshot.endpoints.filter(
    (endpoint) => endpoint.traffic !== "NOT_MEASURED",
  );
  const measured = instrumented.filter((endpoint) => {
    const age = now - Date.parse(endpoint.observedAt ?? "");
    return (
      endpoint.state === "AVAILABLE" &&
      age >= 0 &&
      age <= 30_000 &&
      [
        endpoint.requestRateHz,
        endpoint.clientErrorRateHz,
        endpoint.serverErrorRateHz,
      ].every((rate) => rate !== null && Number.isFinite(rate) && rate >= 0) &&
      endpoint.clientErrorRateHz! + endpoint.serverErrorRateHz! <=
        endpoint.requestRateHz! + 1e-9
    );
  });
  const sum = (
    key: "requestRateHz" | "clientErrorRateHz" | "serverErrorRateHz",
  ) => measured.reduce((total, endpoint) => total + endpoint[key]!, 0);
  const requests = sum("requestRateHz");
  return {
    server: requests > 0 ? sum("serverErrorRateHz") / requests : null,
    client: requests > 0 ? sum("clientErrorRateHz") / requests : null,
    measured: measured.length,
    total: instrumented.length,
    windowSeconds: snapshot.windowSeconds,
  };
}

export const formatRatio = (value: number | null) =>
  value === null
    ? "—"
    : `${(value * 100).toLocaleString("es-PE", { minimumFractionDigits: 1, maximumFractionDigits: 2 })} %`;
