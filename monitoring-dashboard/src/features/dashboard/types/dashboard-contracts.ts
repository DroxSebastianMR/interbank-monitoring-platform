import { z } from "zod";
import { MonitoringContractError } from "@/features/dashboard/utils/dashboard-data-state";
const count = z.number().int().nonnegative();
const timestamp = z.string().datetime({ offset: true });
const metric = z.number().finite().nonnegative().nullable();
const status = z.enum([
  "OPERATIONAL",
  "DEGRADED",
  "UNAVAILABLE",
  "RECOVERING",
  "NO_DATA",
]);
export const overviewContract = z.object({
  generatedAt: timestamp,
  environment: z.string(),
  overallStatus: status,
  monitoredServicesCount: count,
  operationalCount: count,
  degradedCount: count,
  unavailableCount: count,
  noDataCount: count,
  activeIncidentsCount: count,
  activeAlertsCount: count,
  availability: z.number().min(0).max(1).nullable(),
  latencyP95Ms: metric,
  errorRate: z.number().min(0).max(1).nullable(),
  lastObservationAt: timestamp.nullable(),
  dataFreshness: z.enum(["CURRENT", "STALE", "NO_DATA"]),
  services: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        status,
        lastCheckedAt: timestamp.nullable(),
        latencyMs: metric,
        monitoringEnabled: z.boolean(),
      }),
    )
    .max(500),
  recentIncidents: z
    .array(
      z.object({
        id: z.string(),
        title: z.string(),
        severity: z.string(),
        openedAt: timestamp,
        serviceKey: z.string(),
      }),
    )
    .max(100),
  recentAlerts: z
    .array(
      z.object({ id: z.string(), message: z.string(), createdAt: timestamp }),
    )
    .max(100),
  sources: z.object({
    healthChecks: z.string(),
    incidents: z.string(),
    alerts: z.string(),
    httpErrorRate: z.string(),
  }),
});
export const metricsContract = z
  .object({
    from: timestamp,
    to: timestamp,
    source: z.literal("persisted-health-checks"),
    metric: z.enum(["latency", "availability"]),
    unit: z.enum(["ms", "ratio"]),
    points: z
      .array(
        z.object({
          serviceId: z.string(),
          timestamp,
          value: z.number().finite().nonnegative(),
        }),
      )
      .max(5000),
    truncated: z.boolean(),
  })
  .refine(
    (value) =>
      Date.parse(value.to) > Date.parse(value.from) &&
      Date.parse(value.to) - Date.parse(value.from) <= 86_400_000 &&
      (value.metric === "latency"
        ? value.unit === "ms"
        : value.unit === "ratio" &&
          value.points.every(
            (point) => point.value === 0 || point.value === 1,
          )),
  );
export const topologyContract = z.object({
  source: z.string(),
  observedAt: timestamp.nullable(),
  sampling: z.object({
    recommendedIntervalMs: z.number().positive(),
    frequencyHz: z.number().positive(),
  }),
  nodes: z
    .array(
      z.object({
        id: z.string(),
        kind: z.string(),
        status: z.string(),
        telemetrySource: z.string(),
        observedAt: timestamp.nullable(),
        sampleAgeMs: metric,
        latencyMs: metric,
        latencyP95Ms: metric,
        requestRateHz: metric,
        errorRate: z.number().min(0).max(1).nullable(),
      }),
    )
    .max(500),
  edges: z.array(z.object({ from: z.string(), to: z.string() })).max(2000),
});
export function parseMonitoringContract<T>(
  schema: z.ZodType<T>,
  value: unknown,
): T {
  const parsed = schema.safeParse(value);
  if (!parsed.success) throw new MonitoringContractError();
  return parsed.data;
}
