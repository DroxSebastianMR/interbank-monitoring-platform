import { PATHS } from "@/app/router/constants/paths";
import type {
  Incident,
  OperationalAlert,
} from "@/features/incidents/services/incidents.service";
import type {
  HistoricalEvent,
  StateHistorySource,
} from "@/features/dashboard/types/historical-event.types";
import { translateOperationalMessage } from "@/features/dashboard/utils/operational-copy";
import { getServiceStatusLabel } from "@/features/services/constants/service-status";

export function buildHistoricalEvents(
  incidents: Incident[],
  alerts: OperationalAlert[],
  histories: StateHistorySource[],
  serviceId: string,
  search: string,
  from: number,
  to: number,
) {
  const events: HistoricalEvent[] = [];
  const incidentHref = (reference: string) => {
    const params = new URLSearchParams(search);
    params.delete("status");
    params.set("reference", reference);
    return `${PATHS.INCIDENTS}?${params.toString()}`;
  };
  incidents.forEach((incident) => {
    events.push({
      id: `opened:${incident.id}`,
      serviceId: incident.serviceKey,
      type: "INCIDENT_OPENED",
      typeLabel: "Apertura de incidente",
      timestamp: incident.openedAt,
      description: translateOperationalMessage(
        incident.title,
        incident.serviceKey,
      ),
      status: "Apertura registrada",
      href: incidentHref(incident.id),
      permission: "incidents.read",
    });
    if (incident.resolvedAt && incident.status === "RESOLVED")
      events.push({
        id: `resolved:${incident.id}`,
        serviceId: incident.serviceKey,
        type: "RECOVERY",
        typeLabel: "Recuperación confirmada",
        timestamp: incident.resolvedAt,
        description: "El registro del incidente confirma su resolución.",
        status: "Resuelto",
        href: incidentHref(incident.id),
        permission: "incidents.read",
      });
  });
  const byIncident = new Map(
    incidents.map((incident) => [incident.id, incident]),
  );
  // OPENED duplicates the incident record; RECOVERY requires the confirmed resolution above.
  alerts
    .filter((alert) => alert.kind === "ESCALATED")
    .forEach((alert) => {
      const parent = byIncident.get(alert.incidentId);
      const params = new URLSearchParams(search);
      params.delete("status");
      params.delete("service");
      params.set("reference", alert.id);
      events.push({
        id: `alert:${alert.id}`,
        serviceId: parent?.serviceKey ?? null,
        type: "IMPORTANT_ALERT",
        typeLabel: "Alerta importante",
        timestamp: alert.createdAt,
        description: parent
          ? "Se registró una escalada de severidad del incidente."
          : "Se registró una escalada de alerta; servicio no informado en esta respuesta.",
        status: "Escalada registrada",
        href: `${PATHS.ALERTS}?${params.toString()}`,
        permission: "alerts.read",
      });
    });
  histories.forEach((history) =>
    history.data?.forEach((change) => {
      const params = new URLSearchParams(search);
      params.set("from", "overview");
      params.set("stateReference", change.id);
      events.push({
        id: `state:${history.serviceId}:${change.id}`,
        serviceId: history.serviceId,
        type: "STATE_CHANGE",
        typeLabel: "Cambio de estado",
        timestamp: change.changedAt,
        description: `Cambió de ${getServiceStatusLabel(change.fromStatus).toLocaleLowerCase("es-PE")} a ${getServiceStatusLabel(change.toStatus).toLocaleLowerCase("es-PE")}.`,
        status: getServiceStatusLabel(change.toStatus),
        href: `${PATHS.SERVICE_DETAIL(history.serviceId)}?${params.toString()}#state-event-${encodeURIComponent(change.id)}`,
        permission: "services.read",
      });
    }),
  );
  return events
    .filter(
      (event) =>
        Number.isFinite(Date.parse(event.timestamp)) &&
        Date.parse(event.timestamp) >= from &&
        Date.parse(event.timestamp) <= to &&
        (!serviceId || event.serviceId === serviceId),
    )
    .sort(
      (a, b) =>
        Date.parse(b.timestamp) - Date.parse(a.timestamp) ||
        a.id.localeCompare(b.id),
    );
}
