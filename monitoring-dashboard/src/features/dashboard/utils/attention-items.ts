import { PATHS } from "@/app/router/constants/paths";
import type { DashboardOverview } from "@/features/dashboard/types/dashboard.types";
import type { AttentionItem } from "@/features/dashboard/types/attention-item.types";
import { OBSERVATION_MAX_AGE_MS } from "@/features/dashboard/utils/overview-attention";
import { translateOperationalMessage } from "@/features/dashboard/utils/operational-copy";
import type { Incident } from "@/features/incidents/services/incidents.service";

const SEVERITY_ORDER: Record<string, number> = {
  CRITICAL: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
};
const ATTENTION_ORDER: Record<AttentionItem["attentionState"], number> = {
  PENDING: 0,
  OPEN: 1,
  IN_PROGRESS: 2,
  ACKNOWLEDGED: 3,
  REVIEW_REQUIRED: 4,
  UNKNOWN: 5,
};

export function compareAttention(a: AttentionItem, b: AttentionItem) {
  const time = (value: string | null) =>
    value && Number.isFinite(Date.parse(value))
      ? Date.parse(value)
      : Number.MAX_SAFE_INTEGER;
  return (
    (SEVERITY_ORDER[a.severity ?? ""] ?? 4) -
      (SEVERITY_ORDER[b.severity ?? ""] ?? 4) ||
    ATTENTION_ORDER[a.attentionState] - ATTENTION_ORDER[b.attentionState] ||
    time(a.relevantAt) - time(b.relevantAt) ||
    a.id.localeCompare(b.id)
  );
}

export function buildAttentionItems(
  overview: DashboardOverview,
  incidents: Incident[] | undefined,
  serviceId: string,
  search: string,
  now: number,
  overviewCurrent = true,
) {
  // The overview sample contains only unresolved incidents. A fresher detail read can exclude known recoveries.
  const resolved = new Set(
    incidents
      ?.filter(
        (item) =>
          item.resolvedAt !== null ||
          ["RESOLVED", "RECOVERY", "CLOSED"].includes(item.status),
      )
      .map((item) => item.id),
  );
  const active = new Map<
    string,
    {
      id: string;
      serviceKey: string;
      title: string;
      severity: string;
      openedAt: string;
      status: string;
    }
  >();
  if (overviewCurrent && overview.sources.incidents === "AVAILABLE")
    overview.recentIncidents.forEach((item) => {
      if (!resolved.has(item.id))
        active.set(item.id, { ...item, status: "UNKNOWN" });
    });
  incidents?.forEach((item) => {
    if (!resolved.has(item.id)) active.set(item.id, item);
  });
  const missing = overviewCurrent
    ? overview.services.filter((service) => {
        if (service.monitoringEnabled === false) return false;
        const checkedAt = Date.parse(service.lastCheckedAt ?? "");
        return (
          service.status === "NO_DATA" ||
          (Number.isFinite(checkedAt) &&
            now - checkedAt > OBSERVATION_MAX_AGE_MS)
        );
      })
    : [];
  const context = new URLSearchParams(search);
  const incidentsWithMissing = new Set(missing.map((service) => service.id));
  const items: AttentionItem[] = [...active.values()].map((incident) => {
    const params = new URLSearchParams(context);
    params.set("status", "active");
    params.set("reference", incident.id);
    const attentionState =
      incident.status === "OPEN"
        ? "OPEN"
        : incident.status === "ACKNOWLEDGED"
          ? "ACKNOWLEDGED"
          : ["INVESTIGATING", "IN_PROGRESS"].includes(incident.status)
            ? "IN_PROGRESS"
            : "UNKNOWN";
    return {
      id: incident.id,
      type: "INCIDENT",
      serviceId: incident.serviceKey,
      description: translateOperationalMessage(
        incident.title,
        incident.serviceKey,
      ),
      severity: incident.severity,
      attentionState,
      attentionLabel:
        attentionState === "OPEN"
          ? "Abierto"
          : attentionState === "ACKNOWLEDGED"
            ? "Reconocido"
            : attentionState === "IN_PROGRESS"
              ? "En atención"
              : "Atención no informada",
      relevantAt: Number.isFinite(Date.parse(incident.openedAt))
        ? incident.openedAt
        : null,
      observationMissing: incidentsWithMissing.has(incident.serviceKey),
      action: {
        label: "Ver incidente",
        href: `${PATHS.INCIDENTS}?${params.toString()}`,
        permission: "incidents.read",
      },
    };
  });
  for (const service of missing) {
    // Consolidate the diagnostic with its incident rather than duplicating the same service in the queue.
    if (items.some((item) => item.serviceId === service.id)) continue;
    const checkedAt = Date.parse(service.lastCheckedAt ?? "");
    const params = new URLSearchParams(context);
    params.set("from", "overview");
    items.push({
      id: `monitoring:${service.id}`,
      type: "MONITORING",
      serviceId: service.id,
      description: Number.isFinite(checkedAt)
        ? "No se reciben comprobaciones recientes."
        : "Sin comprobaciones registradas por el monitor.",
      severity: null,
      attentionState: "REVIEW_REQUIRED",
      attentionLabel: "Requiere revisión",
      relevantAt:
        Number.isFinite(checkedAt) && checkedAt + OBSERVATION_MAX_AGE_MS <= now
          ? new Date(checkedAt + OBSERVATION_MAX_AGE_MS).toISOString()
          : null,
      observationMissing: true,
      action: {
        label: "Revisar monitoreo",
        href: `${PATHS.SERVICE_DETAIL(service.id)}?${params.toString()}`,
        permission: "services.read",
      },
    });
  }
  return {
    items: items
      .filter((item) => !serviceId || item.serviceId === serviceId)
      .sort(compareAttention),
    knownActiveCount: active.size,
    incomplete:
      !overviewCurrent ||
      overview.sources.incidents !== "AVAILABLE" ||
      overview.activeIncidentsCount > active.size,
  };
}

export function attentionAge(value: string | null, now: number) {
  if (!value) return "Sin fecha";
  const elapsed = now - Date.parse(value);
  if (!Number.isFinite(elapsed) || elapsed < 0) return "Fecha no verificable";
  const minutes = Math.floor(elapsed / 60_000);
  if (minutes < 1) return "Menos de 1 min";
  if (minutes < 60) return `${minutes} min`;
  if (minutes < 1440)
    return `${Math.floor(minutes / 60)} h ${minutes % 60} min`;
  return `${Math.floor(minutes / 1440)} d ${Math.floor((minutes % 1440) / 60)} h`;
}
