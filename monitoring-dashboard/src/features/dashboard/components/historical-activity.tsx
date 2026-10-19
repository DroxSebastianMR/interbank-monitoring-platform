import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { PATHS } from "@/app/router/constants/paths";
import type { OverviewFilters } from "@/features/dashboard/types/overview-filters.types";
import { OVERVIEW_PERIODS } from "@/features/dashboard/types/overview-filters.types";
import type { StateHistorySource } from "@/features/dashboard/types/historical-event.types";
import { buildHistoricalEvents } from "@/features/dashboard/utils/historical-events";
import { getServiceDisplayName } from "@/features/dashboard/utils/operational-copy";
import { serviceObservationTime } from "@/features/dashboard/utils/service-observation";
import type {
  Incident,
  OperationalAlert,
} from "@/features/incidents/services/incidents.service";
import { PanelHeading } from "@/shared/components/panel-heading";
import "./overview-bottom.css";

interface HistoricalSource<T> {
  data?: T[];
  isError: boolean;
  isPending: boolean;
  isPaused: boolean;
}
interface Props {
  filters: OverviewFilters;
  incidents: HistoricalSource<Incident>;
  alerts: HistoricalSource<OperationalAlert>;
  histories: StateHistorySource[];
  canReadIncidents: boolean;
  canReadAlerts: boolean;
  canReadServices: boolean;
}

export function HistoricalActivity({
  filters,
  incidents,
  alerts,
  histories,
  canReadIncidents,
  canReadAlerts,
  canReadServices,
}: Props) {
  const { search } = useLocation();
  const [now, setNow] = useState(Date.now);
  const [expanded, setExpanded] = useState(false);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 10_000);
    return () => window.clearInterval(timer);
  }, []);
  const period = OVERVIEW_PERIODS.find(
    (item) => item.value === filters.period,
  )!;
  const events = useMemo(
    () =>
      buildHistoricalEvents(
        canReadIncidents ? (incidents.data ?? []) : [],
        canReadAlerts ? (alerts.data ?? []) : [],
        canReadServices ? histories : [],
        filters.serviceId,
        search,
        now - period.durationMs,
        now,
      ),
    [
      incidents.data,
      alerts.data,
      histories,
      canReadIncidents,
      canReadAlerts,
      canReadServices,
      filters.serviceId,
      search,
      now,
      period.durationMs,
    ],
  );
  const pending =
    (canReadIncidents && incidents.isPending) ||
    (canReadAlerts && alerts.isPending) ||
    (canReadServices && histories.some((source) => source.isPending));
  const failed =
    (canReadIncidents && (incidents.isError || incidents.isPaused)) ||
    (canReadAlerts && (alerts.isError || alerts.isPaused)) ||
    (canReadServices &&
      histories.some((source) => source.isError || source.isPaused));
  const visible = expanded ? events : events.slice(0, 5);
  const context = new URLSearchParams(search);
  context.delete("status");
  context.delete("reference");
  const suffix = context.size ? `?${context.toString()}` : "";
  return (
    <section
      className="historical-activity overview-bottom-panel"
      aria-labelledby="historical-activity-title"
    >
      <PanelHeading
        id="historical-activity-title"
        title="Actividad reciente"
        description={`${period.label} · ${filters.serviceId ? getServiceDisplayName(filters.serviceId) : "Todos los servicios"}`}
      />
      {pending ? (
        <p className="overview-bottom-message" role="status">
          Consultando registros históricos…
        </p>
      ) : null}
      {failed ? (
        <p className="overview-bottom-message" role="status">
          Actualización parcial. Se conservan los últimos registros históricos
          recibidos.
        </p>
      ) : null}
      {visible.length ? (
        <ol
          className="historical-activity-list"
          aria-label="Eventos históricos por fecha, del más reciente al más antiguo"
        >
          {visible.map((event) => (
            <li key={event.id}>
              <div className="historical-event-meta">
                <span>{event.typeLabel}</span>
                <time dateTime={event.timestamp}>
                  {serviceObservationTime(event.timestamp)} PET
                </time>
              </div>
              <strong>
                {event.serviceId
                  ? getServiceDisplayName(event.serviceId)
                  : "Servicio no informado"}
              </strong>
              <p>{event.description}</p>
              <div className="historical-event-bottom">
                <span>Estado: {event.status}</span>
                <Link
                  to={event.href}
                  aria-label={`Ver registro: ${event.typeLabel}, ${event.serviceId ? getServiceDisplayName(event.serviceId) : "servicio no informado"}`}
                >
                  Ver registro
                  <ArrowUpRight aria-hidden="true" />
                </Link>
              </div>
            </li>
          ))}
        </ol>
      ) : !pending ? (
        <p className="overview-bottom-message">
          {failed
            ? "No se pueden comprobar los eventos del periodo."
            : !canReadIncidents && !canReadAlerts && !canReadServices
              ? "Sin permisos para consultar los historiales."
              : "Sin registros disponibles para este periodo y servicio."}
        </p>
      ) : null}
      <footer className="overview-bottom-footer">
        {events.length > 5 ? (
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            aria-expanded={expanded}
          >
            {expanded
              ? "Ver menos"
              : `Ver todos los registros disponibles (${events.length})`}
          </button>
        ) : null}
        <nav aria-label="Acceso a los historiales completos disponibles">
          {canReadIncidents ? (
            <Link to={`${PATHS.INCIDENTS}${suffix}`}>
              Historial de incidentes
              <ArrowUpRight aria-hidden="true" />
            </Link>
          ) : null}
          {canReadAlerts ? (
            <Link to={`${PATHS.ALERTS}${suffix}`}>
              Historial de alertas
              <ArrowUpRight aria-hidden="true" />
            </Link>
          ) : null}
        </nav>
        <small>
          Histórico independiente de la bandeja de atención. Fuentes según
          permisos: hasta 100 incidentes, 100 alertas y 50 cambios por servicio.
        </small>
      </footer>
    </section>
  );
}
