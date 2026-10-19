import type { DashboardOverview } from "@/features/dashboard/types/dashboard.types";
import { OBSERVATION_MAX_AGE_MS } from "@/features/dashboard/utils/overview-attention";

export const OBSERVED_SERVICE_NAMES: Record<string, string> = {
  login: "Inicio de sesión",
  balance: "Consulta de saldo",
  transfers: "Transferencias ficticias",
};

export function getObservedState(
  service: DashboardOverview["services"][number],
  monitorUnavailable: boolean,
  now: number,
) {
  const checkedAt = Date.parse(service.lastCheckedAt ?? "");
  const recent =
    Number.isFinite(checkedAt) &&
    checkedAt <= now &&
    now - checkedAt <= OBSERVATION_MAX_AGE_MS;
  if (
    monitorUnavailable ||
    !recent ||
    service.monitoringEnabled === false ||
    service.status === "NO_DATA"
  ) {
    return {
      status: "NO_DATA" as const,
      note: monitorUnavailable
        ? "Consulta no actualizada"
        : service.monitoringEnabled === false
          ? "Supervisión pausada"
          : !recent
            ? "Observación ausente o vencida"
            : "Sin observación válida",
    };
  }
  return {
    status:
      service.status === "RECOVERING" ? ("DEGRADED" as const) : service.status,
    note: service.status === "RECOVERING" ? "Recuperación en observación" : "",
  };
}

export function serviceObservationTime(value: string) {
  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
    timeZone: "America/Lima",
  }).format(new Date(value));
}
