import type { DashboardTopology } from "@/features/dashboard/types/dashboard.types";
import type { ServiceStatus } from "@/features/services/types/service.types";

export const INFRASTRUCTURE_COMPONENTS = [
  {
    id: "nginx",
    label: "NGINX",
    source: "active-health-probe",
    sourceLabel: "Sonda del gateway",
  },
  {
    id: "app-backend-1",
    label: "Backend instancia 01",
    source: "prometheus",
    sourceLabel: "Telemetría independiente",
  },
  {
    id: "app-backend-2",
    label: "Backend instancia 02",
    source: "prometheus",
    sourceLabel: "Telemetría independiente",
  },
] as const;

export function infrastructureState(
  topology: DashboardTopology | undefined,
  unavailable: boolean,
  now: number,
) {
  const components = INFRASTRUCTURE_COMPONENTS.map((component) => {
    const node = topology?.nodes.find(
      (candidate) => candidate.id === component.id,
    );
    const observed = Date.parse(node?.observedAt ?? "");
    const measured =
      !unavailable &&
      node?.telemetrySource === component.source &&
      Number.isFinite(observed) &&
      observed <= now &&
      now - observed <= 30_000;
    let status: ServiceStatus = "NO_DATA";
    if (
      measured &&
      node &&
      ["OPERATIONAL", "DEGRADED", "UNAVAILABLE", "RECOVERING"].includes(
        node.status,
      )
    ) {
      status =
        node.status === "RECOVERING"
          ? "DEGRADED"
          : (node.status as ServiceStatus);
    }
    return {
      ...component,
      status,
      observedAt:
        node?.telemetrySource === component.source && Number.isFinite(observed)
          ? node!.observedAt
          : null,
      note:
        status === "NO_DATA"
          ? !node || node.telemetrySource !== component.source
            ? "Sin instrumentación independiente"
            : unavailable
              ? "Consulta sin actualizar"
              : "Sin observación vigente"
          : component.sourceLabel,
    };
  });
  const instances = components.filter((component) => component.id !== "nginx");
  const operational = instances.filter(
    (instance) => instance.status === "OPERATIONAL",
  ).length;
  const unknown = instances.some((instance) => instance.status === "NO_DATA");
  const redundancy = unknown
    ? "Redundancia no verificable: faltan observaciones independientes."
    : operational === 2
      ? "Dos instancias con observaciones operativas. Conmutación no verificada."
      : operational === 1 &&
          instances.some((instance) => instance.status === "UNAVAILABLE")
        ? "Redundancia reducida: una instancia no está disponible."
        : operational === 1
          ? "Una instancia presenta degradación; revisar el respaldo."
          : "Ambas instancias requieren revisión.";
  return { components, redundancy };
}
