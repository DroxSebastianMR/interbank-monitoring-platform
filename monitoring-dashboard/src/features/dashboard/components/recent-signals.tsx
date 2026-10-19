import { useEffect, useId, useState } from "react";
import { ArrowUpRight, BellRing, CircleDashed, Siren } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/app/providers/auth/use-auth";
import { PATHS } from "@/app/router/constants/paths";
import type { DashboardOverview } from "@/features/dashboard/types/dashboard.types";
import {
  attentionAge,
  buildAttentionItems,
} from "@/features/dashboard/utils/attention-items";
import {
  OBSERVED_SERVICE_NAMES,
  serviceObservationTime,
} from "@/features/dashboard/utils/service-observation";
import type { Incident } from "@/features/incidents/services/incidents.service";
import { PanelHeading } from "@/shared/components/panel-heading";
import "./recent-signals.css";

interface Props {
  overview: DashboardOverview;
  overviewUnavailable: boolean;
  incidents?: Incident[];
  incidentsUnavailable: boolean;
  incidentsPending: boolean;
  incidentsUpdatedAt: number;
  canReadIncidents: boolean;
  serviceId: string;
}
const SEVERITY_LABELS: Record<string, string> = {
  CRITICAL: "Crítica",
  HIGH: "Alta",
  MEDIUM: "Media",
  LOW: "Baja",
};
const TYPE_LABELS = {
  INCIDENT: "Incidente",
  ALERT: "Alerta",
  MONITORING: "Monitoreo",
};
const ICONS = { INCIDENT: Siren, ALERT: BellRing, MONITORING: CircleDashed };
const COMPACT_LIMIT = 3;

export function RecentSignals({
  overview,
  overviewUnavailable,
  incidents,
  incidentsUnavailable,
  incidentsPending,
  incidentsUpdatedAt,
  canReadIncidents,
  serviceId,
}: Props) {
  const { employee } = useAuth();
  const { search } = useLocation();
  const listId = useId();
  const [now, setNow] = useState(Date.now);
  const [expanded, setExpanded] = useState(false);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(timer);
  }, []);
  const overviewAge = now - Date.parse(overview.generatedAt);
  const overviewCurrent =
    !overviewUnavailable &&
    Number.isFinite(overviewAge) &&
    overviewAge >= 0 &&
    overviewAge <= 30_000;
  const incidentsCurrent =
    canReadIncidents &&
    !incidentsUnavailable &&
    incidentsUpdatedAt > 0 &&
    now - incidentsUpdatedAt <= 30_000;
  const model = buildAttentionItems(
    overview,
    incidentsCurrent ? incidents : undefined,
    serviceId,
    search,
    now,
    overviewCurrent,
  );
  const visible = expanded ? model.items : model.items.slice(0, COMPACT_LIMIT);
  const allParams = new URLSearchParams(search);
  allParams.set("status", "active");
  allParams.delete("reference");

  return (
    <section
      className="signals-panel attention-panel"
      aria-labelledby="attention-title"
    >
      <PanelHeading
        id="attention-title"
        title="Requiere atención"
        description="Elementos confirmados que requieren revisión."
      >
        {overviewCurrent || incidentsCurrent ? (
          <span className="attention-count">
            {model.items.length}{" "}
            {model.items.length === 1 ? "confirmado" : "confirmados"}
          </span>
        ) : null}
      </PanelHeading>
      {model.items.length ? (
        <ol
          className="attention-list"
          id={listId}
          aria-label="Prioridad, estado de atención y antigüedad"
        >
          {visible.map((item) => {
            const Icon = ICONS[item.type];
            const service =
              OBSERVED_SERVICE_NAMES[item.serviceId] ?? item.serviceId;
            return (
              <li key={`${item.type}:${item.id}`}>
                <div className="attention-item-top">
                  <span>
                    <Icon aria-hidden="true" />
                    {TYPE_LABELS[item.type]}
                  </span>
                  <span
                    className={`attention-severity attention-severity--${item.severity?.toLowerCase() ?? "unknown"}`}
                  >
                    Severidad:{" "}
                    {item.severity
                      ? (SEVERITY_LABELS[item.severity] ?? item.severity)
                      : "Sin clasificar"}
                  </span>
                </div>
                <strong className="attention-service">{service}</strong>
                <p className="attention-description" title={item.description}>
                  {item.description}
                </p>
                {item.type === "INCIDENT" && item.observationMissing ? (
                  <p className="attention-missing">
                    También faltan comprobaciones recientes.
                  </p>
                ) : null}
                <div className="attention-item-bottom">
                  <dl>
                    <div>
                      <dt>Atención</dt>
                      <dd>{item.attentionLabel}</dd>
                    </div>
                    <div>
                      <dt>Antigüedad</dt>
                      <dd>
                        {item.relevantAt ? (
                          <time
                            dateTime={item.relevantAt}
                            title={`${serviceObservationTime(item.relevantAt)} PET`}
                          >
                            {attentionAge(item.relevantAt, now)}
                          </time>
                        ) : (
                          "Sin fecha"
                        )}
                      </dd>
                    </div>
                  </dl>
                  {employee?.permissions.includes(item.action.permission) ? (
                    <Link
                      className="attention-link"
                      to={item.action.href}
                      aria-label={`${item.action.label}: ${service}`}
                    >
                      {item.action.label}
                      <ArrowUpRight aria-hidden="true" />
                    </Link>
                  ) : (
                    <span className="attention-no-permission">
                      Sin permiso de detalle
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      ) : (
        <div className="attention-empty" role="status">
          {incidentsPending && canReadIncidents && !overviewCurrent
            ? "Consultando incidentes abiertos…"
            : !overviewCurrent && !incidentsCurrent
              ? "No se pueden comprobar los elementos pendientes."
              : model.incomplete
                ? "Sin elementos confirmados en la muestra disponible."
                : "Sin elementos pendientes."}
        </div>
      )}
      <footer className="attention-footer">
        {model.items.length > COMPACT_LIMIT ? (
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            aria-expanded={expanded}
            aria-controls={listId}
          >
            {expanded ? "Ver menos" : `Ver todos (${model.items.length})`}
          </button>
        ) : null}
        {canReadIncidents ? (
          <Link to={`${PATHS.INCIDENTS}?${allParams.toString()}`}>
            Ver todos los incidentes
            <ArrowUpRight aria-hidden="true" />
          </Link>
        ) : null}
        {!overviewCurrent ? (
          <p>
            Supervisión sin actualizar; no se pueden verificar afectaciones de
            monitoreo.
          </p>
        ) : null}
        {incidentsUnavailable && canReadIncidents ? (
          <p>
            Falló la consulta de incidentes; solo se muestran los confirmados
            por el resumen vigente.
          </p>
        ) : null}
        {model.incomplete ? (
          <p>
            Cobertura parcial de incidentes. Consulta el historial de abiertos.
          </p>
        ) : null}
        <p>
          Alertas: reconocimiento no instrumentado; pendientes no verificables.
        </p>
      </footer>
    </section>
  );
}
