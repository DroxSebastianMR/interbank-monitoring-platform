import { PATHS } from "@/app/router/constants/paths";
import type { DashboardOverview } from "@/features/dashboard/types/dashboard.types";

export const OBSERVATION_MAX_AGE_MS = 30_000;

export interface OverviewAttention {
  condition:
    | "operational"
    | "degraded"
    | "unavailable"
    | "no-data"
    | "disconnected"
    | "incident";
  message: string;
  action?: { label: string; href: string };
}

type Service = DashboardOverview["services"][number];
const SERVICE_NAMES: Record<string, string> = {
  balance: "Consulta de saldo",
  transfers: "Transferencias",
  login: "Inicio de sesión",
};
const serviceName = (service: Service) =>
  SERVICE_NAMES[service.id] ?? service.name;

/** Resolve one global condition; preventive alerts never establish an incident. */
export function getOverviewAttention(
  overview: DashboardOverview | undefined,
  disconnected: boolean,
  now: number,
): OverviewAttention {
  if (disconnected || !overview) {
    return {
      condition: "disconnected",
      message: "No se puede comprobar el estado actual.",
    };
  }

  const current = (service: Service) => {
    const checkedAt = Date.parse(service.lastCheckedAt ?? "");
    return (
      service.monitoringEnabled &&
      Number.isFinite(checkedAt) &&
      checkedAt <= now &&
      now - checkedAt <= OBSERVATION_MAX_AGE_MS &&
      service.status !== "NO_DATA"
    );
  };
  const severity: Record<string, number> = {
    CRITICAL: 0,
    HIGH: 1,
    MEDIUM: 2,
    LOW: 3,
  };
  const incidents = [...overview.recentIncidents].sort(
    (a, b) =>
      (severity[a.severity] ?? 4) - (severity[b.severity] ?? 4) ||
      a.openedAt.localeCompare(b.openedAt),
  );
  // Prefer the service with the most severe confirmed incident within each state.
  const services = [...overview.services].sort((a, b) => {
    const rank = (id: string) => {
      const index = incidents.findIndex(
        (incident) => incident.serviceKey === id,
      );
      return index < 0 ? incidents.length : index;
    };
    return rank(a.id) - rank(b.id);
  });
  const unavailable = services.find(
    (service) => current(service) && service.status === "UNAVAILABLE",
  );
  if (unavailable) {
    const confirmed =
      overview.activeIncidentsCount > 0 &&
      incidents.some((incident) => incident.serviceKey === unavailable.id);
    return {
      condition: "unavailable",
      message: `${serviceName(unavailable)} no está disponible.`,
      action: confirmed
        ? { label: "Ver incidente", href: PATHS.INCIDENTS }
        : {
            label: "Revisar servicio",
            href: PATHS.SERVICE_DETAIL(unavailable.id),
          },
    };
  }
  const degraded = services.find(
    (service) =>
      current(service) &&
      (service.status === "DEGRADED" || service.status === "RECOVERING"),
  );
  if (degraded) {
    // DEGRADED can also mean a failed probe below the incident threshold, not only latency.
    return {
      condition: "degraded",
      message: `${serviceName(degraded)} ${degraded.status === "RECOVERING" ? "se está recuperando" : "presenta degradación"}.`,
      action: {
        label: "Revisar servicio",
        href: PATHS.SERVICE_DETAIL(degraded.id),
      },
    };
  }
  const missing = services.find((service) => !current(service));
  if (
    missing ||
    !services.length ||
    overview.dataFreshness !== "CURRENT" ||
    overview.noDataCount > 0 ||
    overview.overallStatus !== "OPERATIONAL" ||
    overview.operationalCount !== services.length ||
    overview.monitoredServicesCount !== services.length
  ) {
    return {
      condition: "no-data",
      message: "No se reciben datos recientes del servicio.",
      action: {
        label: "Revisar monitoreo",
        href: missing ? PATHS.SERVICE_DETAIL(missing.id) : PATHS.SERVICES,
      },
    };
  }
  if (overview.activeIncidentsCount > 0 || incidents.length > 0) {
    return {
      condition: "incident",
      message: `${overview.activeIncidentsCount || incidents.length} ${overview.activeIncidentsCount === 1 || (!overview.activeIncidentsCount && incidents.length === 1) ? "incidente abierto" : "incidentes abiertos"}.`,
      action: { label: "Ver incidente", href: PATHS.INCIDENTS },
    };
  }
  if (overview.sources.incidents !== "AVAILABLE") {
    return {
      condition: "disconnected",
      message: "No se puede comprobar el estado actual.",
    };
  }
  const count = services.length;
  return {
    condition: "operational",
    message:
      count === 1
        ? "El servicio está operativo. Sin incidentes abiertos."
        : `Los ${count} servicios están operativos. Sin incidentes abiertos.`,
  };
}
