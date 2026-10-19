import { describe, expect, it } from "vitest";
import { overviewFixture, topologyFixture, metricFixture } from "./fixtures";
import { getOverviewAttention } from "../../src/features/dashboard/utils/overview-attention";
import { buildAttentionItems } from "../../src/features/dashboard/utils/attention-items";
import {
  summarizeProbes,
  formatRatio,
} from "../../src/features/dashboard/utils/indicator-metrics";
import { buildPerformanceSeries } from "../../src/features/dashboard/utils/performance-series";
import { infrastructureState } from "../../src/features/dashboard/utils/infrastructure-state";
import {
  monitoringFailure,
  monitoringPoll,
  retryMonitoringQuery,
  MonitoringContractError,
} from "../../src/features/dashboard/utils/dashboard-data-state";
import {
  overviewContract,
  metricsContract,
  parseMonitoringContract,
} from "../../src/features/dashboard/types/dashboard-contracts";
import { buildHistoricalEvents } from "../../src/features/dashboard/utils/historical-events";
import type { Incident } from "../../src/features/incidents/services/incidents.service";

const now = Date.parse("2026-10-18T12:15:00Z");
const incident: Incident = {
  id: "incident-1",
  serviceKey: "transfers",
  title: "transfers unavailable",
  status: "OPEN",
  severity: "HIGH",
  openedAt: new Date(now - 600000).toISOString(),
  lastObservedAt: new Date(now).toISOString(),
  resolvedAt: null,
};

describe("operational scenarios A–F and contract safeguards", () => {
  it("A: all three operational with a compact factual message", () => {
    expect(getOverviewAttention(overviewFixture(now), false, now)).toEqual({
      condition: "operational",
      message: "Los 3 servicios están operativos. Sin incidentes abiertos.",
    });
  });
  it("B: degraded service has its real service detail action", () => {
    const data = overviewFixture(now);
    data.services[1].status = "DEGRADED";
    expect(getOverviewAttention(data, false, now)).toMatchObject({
      condition: "degraded",
      action: { href: "/services/balance" },
    });
  });
  it("C: confirmed outage takes precedence over degradation and links an incident", () => {
    const data = overviewFixture(now);
    data.services[1].status = "DEGRADED";
    data.services[2].status = "UNAVAILABLE";
    data.activeIncidentsCount = 1;
    data.recentIncidents = [incident];
    expect(getOverviewAttention(data, false, now)).toMatchObject({
      condition: "unavailable",
      action: { label: "Ver incidente" },
    });
    const queue = buildAttentionItems(data, [incident], "", "", now);
    expect(queue.items).toHaveLength(1);
    expect(queue.items[0].action.href).toContain("reference=incident-1");
  });
  it("D: confirmed historical recovery stays out of the attention queue", () => {
    const resolved = {
      ...incident,
      status: "RESOLVED",
      resolvedAt: new Date(now - 1000).toISOString(),
    };
    expect(
      buildAttentionItems(overviewFixture(now), [resolved], "", "", now).items,
    ).toHaveLength(0);
    const history = buildHistoricalEvents(
      [resolved],
      [],
      [],
      "",
      "",
      now - 3600000,
      now,
    );
    expect(history.map((event) => event.type)).toContain("RECOVERY");
  });
  it("E: missing metrics never become 0 or 100 percent", () => {
    expect(
      summarizeProbes(undefined, ["balance"], "availability").value,
    ).toBeNull();
    expect(formatRatio(null)).toBe("—");
    const sparse = metricFixture("availability", now - 3600000, now, "balance");
    sparse.points = sparse.points.slice(0, 1);
    expect(
      summarizeProbes(sparse, ["balance"], "availability").value,
    ).toBeNull();
  });
  it("valid measured zero availability is not mistaken for missing data", () => {
    const measured = metricFixture(
      "availability",
      now - 3600000,
      now,
      "balance",
    );
    measured.points.forEach((point) => {
      point.value = 0;
    });
    expect(summarizeProbes(measured, ["balance"], "availability").value).toBe(
      0,
    );
  });
  it("a stale service cannot be hidden behind another fresh observation", () => {
    const data = overviewFixture(now);
    data.services[0].lastCheckedAt = new Date(now - 31000).toISOString();
    expect(getOverviewAttention(data, false, now).condition).toBe("no-data");
  });
  it("F: lost monitor does not assert that the banking system is operational", () => {
    expect(
      getOverviewAttention(overviewFixture(now), true, now).condition,
    ).toBe("disconnected");
  });
  it.each([401, 403, 404, 0, 503])(
    "distinguishes HTTP status %s instead of an empty table",
    (status) => {
      const expected: Record<number, string> = {
        401: "unauthorized",
        403: "forbidden",
        404: "incompatible",
        0: "disconnected",
        503: "error",
      };
      expect(monitoringFailure({ status }).state).toBe(expected[status]);
    },
  );
  it("does not poll/retry authorization or incompatible contracts", () => {
    for (const error of [
      { status: 401 },
      { status: 403 },
      { status: 404 },
      new MonitoringContractError(),
    ]) {
      expect(monitoringPoll(error)).toBe(false);
      expect(retryMonitoringQuery(0, error)).toBe(false);
    }
  });
  it("rejects the legacy summary instead of filling unknown fields with zero", () => {
    expect(() =>
      parseMonitoringContract(overviewContract, {
        total: 3,
        byStatus: { OPERATIONAL: 3 },
      }),
    ).toThrow(MonitoringContractError);
    expect(
      parseMonitoringContract(overviewContract, overviewFixture(now))
        .monitoredServicesCount,
    ).toBe(3);
  });
  it("rejects availability with incompatible units", () => {
    const data = metricFixture("availability", now - 3600000, now);
    data.unit = "ms";
    expect(() => parseMonitoringContract(metricsContract, data)).toThrow(
      MonitoringContractError,
    );
  });
  it("does not infer independent instance health from configured edges", () => {
    const topology = topologyFixture(now);
    topology.nodes[1].telemetrySource = "configured-topology";
    const state = infrastructureState(topology, false, now);
    expect(state.components[1].status).toBe("NO_DATA");
    expect(state.redundancy).toContain("no verificable");
  });
  it("truncated observations cannot publish full availability", () => {
    const data = metricFixture("availability", now - 3600000, now);
    data.truncated = true;
    expect(
      summarizeProbes(data, ["login", "balance", "transfers"], "availability")
        .value,
    ).toBeNull();
  });
  it("retains empty p95 intervals instead of interpolating an outage in observations", () => {
    const data = metricFixture("latency", now - 900000, now, "balance");
    data.points = data.points.filter(
      (point) =>
        Date.parse(point.timestamp) < now - 600000 ||
        Date.parse(point.timestamp) >= now - 300000,
    );
    const result = buildPerformanceSeries(data, ["balance"], "15m")!;
    expect(result.lines[0].buckets.map((bucket) => bucket.value)).toEqual([
      80,
      null,
      80,
    ]);
  });
  it("preventive alerts alone do not establish an incident", () => {
    const data = overviewFixture(now);
    data.activeAlertsCount = 4;
    expect(getOverviewAttention(data, false, now).condition).toBe(
      "operational",
    );
    expect(buildAttentionItems(data, [], "", "", now).items).toHaveLength(0);
  });
});
