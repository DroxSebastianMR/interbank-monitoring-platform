import type {
  DashboardOverview,
  DashboardTopology,
  MetricSeries,
} from "../../src/features/dashboard/types/dashboard.types";
export function overviewFixture(now = Date.now()): DashboardOverview {
  const generatedAt = new Date(now).toISOString();
  const observed = new Date(now - 1000).toISOString();
  return {
    generatedAt,
    environment: "laboratory",
    overallStatus: "OPERATIONAL",
    monitoredServicesCount: 3,
    operationalCount: 3,
    degradedCount: 0,
    unavailableCount: 0,
    noDataCount: 0,
    activeIncidentsCount: 0,
    activeAlertsCount: 0,
    availability: 1,
    latencyP95Ms: 90,
    errorRate: null,
    lastObservationAt: observed,
    dataFreshness: "CURRENT",
    services: ["login", "balance", "transfers"].map((id) => ({
      id,
      name: id,
      status: "OPERATIONAL",
      lastCheckedAt: observed,
      latencyMs: 80,
      monitoringEnabled: true,
    })),
    recentIncidents: [],
    recentAlerts: [],
    sources: {
      healthChecks: "AVAILABLE",
      incidents: "AVAILABLE",
      alerts: "AVAILABLE",
      httpErrorRate: "NOT_INSTRUMENTED",
    },
  };
}
export function metricFixture(
  metric: "latency" | "availability",
  from: number,
  to: number,
  serviceId?: string,
): MetricSeries {
  const step = Math.max(10000, Math.ceil((to - from) / 1200));
  const points: MetricSeries["points"] = [];
  for (const id of serviceId
    ? [serviceId]
    : ["login", "balance", "transfers"]) {
    for (let time = from; time < to; time += step)
      points.push({
        serviceId: id,
        timestamp: new Date(time).toISOString(),
        value: metric === "latency" ? 80 : 1,
      });
  }
  return {
    from: new Date(from).toISOString(),
    to: new Date(to).toISOString(),
    source: "persisted-health-checks",
    metric,
    unit: metric === "latency" ? "ms" : "ratio",
    points,
    truncated: false,
  };
}
export function topologyFixture(now = Date.now()): DashboardTopology {
  const observedAt = new Date(now - 1000).toISOString();
  return {
    source: "active-probe-and-prometheus",
    observedAt,
    sampling: { recommendedIntervalMs: 10000, frequencyHz: 0.1 },
    nodes: ["nginx", "app-backend-1", "app-backend-2"].map((id) => ({
      id,
      kind: id === "nginx" ? "gateway" : "instance",
      status: "OPERATIONAL",
      telemetrySource: id === "nginx" ? "active-health-probe" : "prometheus",
      observedAt,
      sampleAgeMs: 1000,
      latencyMs: 80,
      latencyP95Ms: 90,
      requestRateHz: id === "nginx" ? null : 2,
      errorRate: id === "nginx" ? null : 0,
    })),
    edges: [
      { from: "nginx", to: "app-backend-1" },
      { from: "nginx", to: "app-backend-2" },
    ],
  };
}
