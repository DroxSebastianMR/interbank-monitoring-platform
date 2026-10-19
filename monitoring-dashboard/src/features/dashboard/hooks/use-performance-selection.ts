import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { PERFORMANCE_METRICS } from "@/features/dashboard/utils/performance-series";
import type {
  PerformanceMetric,
  PerformanceBucket,
} from "@/features/dashboard/utils/performance-series";

export function usePerformanceSelection() {
  const [params, setParams] = useSearchParams();
  const raw = params.get("performance");
  const metric: PerformanceMetric =
    PERFORMANCE_METRICS.find((item) => item.value === raw)?.value ??
    "latency-p95";
  useEffect(() => {
    if (!raw || raw === metric) return;
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        next.set("performance", metric);
        return next;
      },
      { replace: true },
    );
  }, [raw, metric, setParams]);
  return {
    metric,
    setMetric: (value: PerformanceMetric) =>
      setParams((current) => {
        const next = new URLSearchParams(current);
        next.set("performance", value);
        ["observationFrom", "observationTo", "observationService"].forEach(
          (key) => next.delete(key),
        );
        return next;
      }),
    selectInterval: (serviceId: string, bucket: PerformanceBucket) =>
      setParams((current) => {
        const next = new URLSearchParams(current);
        next.set("observationFrom", new Date(bucket.from).toISOString());
        next.set("observationTo", new Date(bucket.to).toISOString());
        next.set("observationService", serviceId);
        return next;
      }),
  };
}
