import type { AxiosAdapter } from "axios";
import { overviewFixture, metricFixture, topologyFixture } from "./fixtures";
export type Scenario =
  | "healthy"
  | "degraded"
  | "incident"
  | "empty"
  | "no-data"
  | "partial"
  | "offline"
  | "forbidden"
  | "unauthorized"
  | "legacy";
export const fixtureAdapter =
  (
    getScenario: () => Scenario,
    trace?: (url: string, params: unknown) => void,
  ): AxiosAdapter =>
  async (config) => {
    const scenario = getScenario();
    const url = config.url ?? "";
    trace?.(url, config.params);
    const fail = (status: number): never => {
      throw Object.assign(new Error(`Controlled test response ${status}`), {
        status,
      });
    };
    if (scenario === "offline") fail(0);
    if (url === "/dashboard/overview" && scenario === "forbidden") fail(403);
    if (url === "/dashboard/overview" && scenario === "unauthorized") fail(401);
    if (url === "/dashboard/metrics" && scenario === "partial") fail(503);
    const now = Date.now();
    const overview = overviewFixture(now);
    const active = {
      id: "active-incident",
      serviceKey: "transfers",
      title: "transfers unavailable",
      status: "OPEN",
      severity: "HIGH",
      openedAt: new Date(now - 600000).toISOString(),
      lastObservedAt: new Date(now - 1000).toISOString(),
      resolvedAt: null,
    };
    const resolved = {
      ...active,
      id: "resolved-incident",
      serviceKey: "login",
      status: "RESOLVED",
      resolvedAt: new Date(now - 90000).toISOString(),
    };
    if (scenario === "degraded") {
      overview.services[1].status = "DEGRADED";
      overview.services[1].latencyMs = 1800;
      overview.degradedCount = 1;
      overview.operationalCount = 2;
      overview.overallStatus = "DEGRADED";
    }
    if (scenario === "incident") {
      overview.services[2].status = "UNAVAILABLE";
      overview.unavailableCount = 1;
      overview.operationalCount = 2;
      overview.overallStatus = "UNAVAILABLE";
      overview.activeIncidentsCount = 1;
      overview.recentIncidents = [active];
    }
    if (scenario === "no-data") {
      overview.services.forEach((service) => {
        service.status = "NO_DATA";
        service.lastCheckedAt = null;
        service.latencyMs = null;
      });
      overview.operationalCount = 0;
      overview.noDataCount = 3;
      overview.overallStatus = "NO_DATA";
      overview.dataFreshness = "NO_DATA";
      overview.lastObservationAt = null;
    }
    if (scenario === "empty") {
      overview.services = [];
      overview.monitoredServicesCount = 0;
      overview.operationalCount = 0;
      overview.overallStatus = "NO_DATA";
      overview.dataFreshness = "NO_DATA";
      overview.lastObservationAt = null;
    }
    const serviceId =
      /\/monitored-services\/([^/]+)/.exec(url)?.[1] ?? "balance";
    const service = {
      ...(overview.services.find((item) => item.id === serviceId) ??
        overviewFixture(now).services[1]),
      message: "",
      criticality: "HIGH",
      riskLevel: "LOW",
      version: 1,
    };
    let data: unknown;
    if (url === "/dashboard/overview")
      data =
        scenario === "legacy"
          ? { total: 3, byStatus: { OPERATIONAL: 3 } }
          : overview;
    else if (url === "/dashboard/metrics") {
      data = metricFixture(
        config.params.metric,
        Date.parse(config.params.from),
        Date.parse(config.params.to),
        config.params.serviceId,
      );
      if (scenario === "no-data" || scenario === "empty")
        data = { ...(data as object), points: [] };
    } else if (url === "/dashboard/topology") data = topologyFixture(now);
    else if (url === "/monitored-services")
      data = overview.services.map((item) => ({
        ...item,
        message: "",
        riskLevel: "LOW",
        criticality: "HIGH",
      }));
    else if (url.endsWith("/state-history"))
      data = [
        {
          id: `change-${serviceId}`,
          fromStatus: "DEGRADED",
          toStatus: "OPERATIONAL",
          reason: null,
          changedAt: new Date(now - 120000).toISOString(),
        },
      ];
    else if (url.endsWith("/checks") || url.endsWith("/config-history"))
      data = [];
    else if (url.endsWith("/instances"))
      data = { instrumented: false, instances: [] };
    else if (url.startsWith("/monitored-services/")) data = service;
    else if (url === "/incidents")
      data = scenario === "incident" ? [active, resolved] : [resolved];
    else if (url === "/alerts") data = [];
    else if (url === "/endpoint-observability/snapshot")
      data = {
        cursor: {
          streamId: "00000000-0000-4000-8000-000000000001",
          sequence: 1,
        },
        sourceState: "AVAILABLE",
        generatedAt: new Date(now).toISOString(),
        lastSuccessAt: new Date(now).toISOString(),
        windowSeconds: 120,
        refreshIntervalMs: 10000,
        instances: ["app-backend-1", "app-backend-2"].map((id) => ({
          id,
          state: "AVAILABLE",
          observedAt: new Date(now).toISOString(),
          endpointCount: 0,
        })),
        endpoints: [],
      };
    else fail(404);
    return { data, status: 200, statusText: "OK", headers: {}, config };
  };
