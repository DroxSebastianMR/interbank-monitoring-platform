import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { PATHS } from "@/app/router/constants/paths";
import type {
  DashboardOverview,
  MetricSeries,
} from "@/features/dashboard/types/dashboard.types";
import { OVERVIEW_PERIODS } from "@/features/dashboard/types/overview-filters.types";
import type { OverviewFilters } from "@/features/dashboard/types/overview-filters.types";
import {
  getObservedState,
  OBSERVED_SERVICE_NAMES,
  serviceObservationTime,
} from "@/features/dashboard/utils/service-observation";
import { ServiceLatencyTrend } from "@/features/dashboard/components/service-latency-trend";
import type { MonitoredService } from "@/features/services/types/service.types";
import { SERVICE_STATUS_META } from "@/features/services/constants/service-status";
import { getRiskLevelLabel } from "@/features/services/constants/service.constants";
import { PanelHeading } from "@/shared/components/panel-heading";
import "./network-schedule.css";

const EMPTY_POINTS: MetricSeries["points"] = [];

interface Props {
  services: DashboardOverview["services"];
  monitorUnavailable: boolean;
  observations?: MonitoredService[];
  observationsUnavailable: boolean;
  observationsUpdatedAt: number;
  canReadServices: boolean;
  filters: OverviewFilters;
  metrics?: MetricSeries;
  metricsUnavailable: boolean;
  metricsPending: boolean;
  canReadMetrics: boolean;
}

export function NetworkSchedule({
  services,
  monitorUnavailable,
  observations,
  observationsUnavailable,
  observationsUpdatedAt,
  canReadServices,
  filters,
  metrics,
  metricsUnavailable,
  metricsPending,
  canReadMetrics,
}: Props) {
  const navigate = useNavigate();
  const location = useLocation();
  const [now, setNow] = useState(Date.now);
  const [trendOpen, setTrendOpen] = useState(false);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(timer);
  }, []);
  const context = new URLSearchParams(location.search);
  context.set("from", "overview");
  const hrefFor = (id: string) =>
    `${PATHS.SERVICE_DETAIL(id)}?${context.toString()}`;
  const from = Date.parse(metrics?.from ?? "");
  const to = Date.parse(metrics?.to ?? "");
  const validHistory =
    canReadMetrics &&
    !metricsUnavailable &&
    metrics?.source === "persisted-health-checks" &&
    metrics.metric === "latency" &&
    metrics.unit === "ms" &&
    Number.isFinite(from) &&
    to > from &&
    now - to <= 30_000 &&
    to <= now;
  const history = useMemo(
    () =>
      validHistory
        ? metrics!.points.filter((point) => {
            const time = Date.parse(point.timestamp);
            return (
              time >= from &&
              time <= to &&
              Number.isFinite(point.value) &&
              point.value >= 0
            );
          })
        : [],
    [metrics, validHistory, from, to],
  );
  const riskAvailable =
    canReadServices &&
    !observationsUnavailable &&
    now - observationsUpdatedAt <= 30_000;
  const historyByService = useMemo(() => {
    const grouped = new Map<string, MetricSeries["points"]>();
    for (const point of history) {
      const points = grouped.get(point.serviceId) ?? [];
      points.push(point);
      grouped.set(point.serviceId, points);
    }
    return grouped;
  }, [history]);
  const period = OVERVIEW_PERIODS.find(
    (item) => item.value === filters.period,
  )!.label;

  return (
    <section
      className="schedule-panel service-state-panel"
      aria-labelledby="service-state-title"
    >
      <PanelHeading
        id="service-state-title"
        title="Estado por servicio"
        description="Estado actual y última latencia de sonda. Riesgo observado por separado."
      >
        <span className="service-state-count">
          {services.length} {services.length === 1 ? "servicio" : "servicios"}
        </span>
      </PanelHeading>
      <div
        className="service-state-scroll"
        tabIndex={0}
        role="region"
        aria-label="Estado por servicio, tabla desplazable"
      >
        <table className="service-state-table">
          <caption className="sr-only">
            Servicios supervisados. Horarios de Lima (PET). La latencia
            corresponde a sondas, no a solicitudes bancarias.
          </caption>
          <thead>
            <tr>
              {[
                "Nombre",
                "Estado operativo",
                "Última latencia",
                "Riesgo observado",
                "Última comprobación",
                "Detalle",
              ].map((label) => (
                <th scope="col" key={label}>
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {services.map((service) => {
              const { status, note } = getObservedState(
                service,
                monitorUnavailable,
                now,
              );
              const meta = SERVICE_STATUS_META[status];
              const Icon = meta.icon;
              const name = OBSERVED_SERVICE_NAMES[service.id] ?? service.name;
              const risk = riskAvailable
                ? observations?.find((item) => item.id === service.id)
                    ?.riskLevel
                : null;
              const checkedAt =
                service.lastCheckedAt &&
                Number.isFinite(Date.parse(service.lastCheckedAt))
                  ? service.lastCheckedAt
                  : null;
              const latency =
                status !== "NO_DATA" &&
                service.latencyMs !== null &&
                Number.isFinite(service.latencyMs) &&
                service.latencyMs >= 0
                  ? service.latencyMs
                  : null;
              return (
                <tr
                  key={service.id}
                  className={
                    canReadServices
                      ? "service-state-row is-actionable"
                      : "service-state-row"
                  }
                  onClick={
                    canReadServices
                      ? (event) => {
                          if (
                            event.defaultPrevented ||
                            event.button !== 0 ||
                            event.ctrlKey ||
                            event.metaKey ||
                            event.shiftKey ||
                            event.altKey ||
                            (event.target instanceof Element &&
                              event.target.closest("a, button, summary")) ||
                            window.getSelection()?.toString()
                          )
                            return;
                          void navigate(hrefFor(service.id));
                        }
                      : undefined
                  }
                >
                  <th scope="row">
                    {canReadServices ? (
                      <Link
                        to={hrefFor(service.id)}
                        className="service-state-name"
                      >
                        {name}
                      </Link>
                    ) : (
                      name
                    )}
                  </th>
                  <td>
                    <span
                      className={`service-state-status service-state-status--${status.toLowerCase()}`}
                    >
                      <Icon aria-hidden="true" />
                      {meta.label}
                    </span>
                    {note ? <small>{note}</small> : null}
                  </td>
                  <td>
                    <strong className="service-state-latency">
                      {latency === null
                        ? "—"
                        : `${Math.round(latency).toLocaleString("es-PE")} ms`}
                    </strong>
                    <small>
                      {latency === null
                        ? "Sin medición vigente"
                        : "Última sonda"}
                    </small>
                  </td>
                  <td>
                    <span className="service-state-risk">
                      {risk ? getRiskLevelLabel(risk) : "Sin datos"}
                    </span>
                    <small>
                      {!canReadServices
                        ? "Sin permiso de consulta"
                        : observationsUnavailable
                          ? "Consulta no disponible"
                          : risk
                            ? "Análisis sin fecha propia"
                            : "Sin análisis disponible"}
                    </small>
                  </td>
                  <td>
                    {checkedAt ? (
                      <time
                        dateTime={checkedAt}
                        title={`${serviceObservationTime(checkedAt)} PET`}
                      >
                        {serviceObservationTime(checkedAt)}
                      </time>
                    ) : (
                      "Sin comprobar"
                    )}
                    <small>
                      {status === "NO_DATA" && checkedAt
                        ? "Último registro · no confirma estado actual"
                        : "PET"}
                    </small>
                  </td>
                  <td>
                    {canReadServices ? (
                      <Link
                        className="service-state-detail"
                        to={hrefFor(service.id)}
                        aria-label={`Ver detalle de ${name}`}
                      >
                        Ver
                        <ArrowUpRight aria-hidden="true" />
                      </Link>
                    ) : (
                      <span className="service-state-note">Sin permiso</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {!services.length ? (
        <p className="service-state-note">
          No hay servicios disponibles para este filtro.
        </p>
      ) : null}
      <details
        className="service-state-history"
        onToggle={(event) => setTrendOpen(event.currentTarget.open)}
      >
        <summary>Tendencia de latencia de sondas · {period}</summary>
        {trendOpen ? (
          <div className="service-state-trends">
            {!canReadMetrics ? (
              <p>Sin permiso para consultar métricas históricas.</p>
            ) : metricsPending ? (
              <p role="status">Consultando observaciones…</p>
            ) : metricsUnavailable ? (
              <p>No se pudo actualizar el historial de sondas.</p>
            ) : !validHistory || !history.length ? (
              <p>Sin observaciones históricas disponibles para este periodo.</p>
            ) : (
              <>
                <p>
                  Observaciones persistidas · {period}. Los huecos sin datos no
                  se conectan.
                  {metrics?.truncated
                    ? " Respuesta parcial: se alcanzó el límite de 5.000 muestras."
                    : ""}
                </p>
                {services.map((service) => (
                  <ServiceLatencyTrend
                    key={service.id}
                    name={OBSERVED_SERVICE_NAMES[service.id] ?? service.name}
                    points={historyByService.get(service.id) ?? EMPTY_POINTS}
                    from={from}
                    to={to}
                  />
                ))}
              </>
            )}
          </div>
        ) : null}
      </details>
    </section>
  );
}
