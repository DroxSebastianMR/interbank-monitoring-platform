import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowUpRight,
  Bell,
  CircleAlert,
  Gauge,
  RadioTower,
  Siren,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/app/providers/auth/use-auth";
import { PATHS } from "@/app/router/constants/paths";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type {
  DashboardOverview,
  MetricSeries,
} from "@/features/dashboard/types/dashboard.types";
import type { OverviewFilters } from "@/features/dashboard/types/overview-filters.types";
import { OVERVIEW_PERIODS } from "@/features/dashboard/types/overview-filters.types";
import {
  formatRatio,
  summarizeHttpErrors,
  summarizeProbes,
} from "@/features/dashboard/utils/indicator-metrics";
import { getServiceDisplayName } from "@/features/dashboard/utils/operational-copy";
import type { EndpointSnapshot } from "@/features/endpoints/types/endpoint.types";
import {
  ServiceKpiCard,
  ServiceKpiGrid,
} from "@/features/services/components/service-kpi-card";
import "./overview-indicators.css";
import {
  monitoringAccessDenied,
  monitoringFailure,
} from "@/features/dashboard/utils/dashboard-data-state";

interface QueryState<T> {
  error?: unknown;
  data?: T;
  isPending: boolean;
  isError: boolean;
  isPaused: boolean;
}
interface Props {
  overview: DashboardOverview;
  overviewUnavailable: boolean;
  filters: OverviewFilters;
  metrics: QueryState<MetricSeries>;
  availability: QueryState<MetricSeries>;
  endpoints: QueryState<EndpointSnapshot>;
  canReadMetrics: boolean;
  canReadEndpoints: boolean;
}

const SEVERITIES: Record<string, string> = {
  CRITICAL: "Crítica",
  HIGH: "Alta",
  MEDIUM: "Media",
  LOW: "Baja",
};
const timestamp = (value: string) =>
  new Date(value).toLocaleString("es-PE", {
    timeZone: "America/Lima",
    hour12: false,
  });

export function OverviewIndicators({
  overview,
  overviewUnavailable,
  filters,
  metrics,
  availability,
  endpoints,
  canReadMetrics,
  canReadEndpoints,
}: Props) {
  const { employee } = useAuth();
  const [now, setNow] = useState(Date.now);
  const [detail, setDetail] = useState<"availability" | "latency" | null>(null);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(timer);
  }, []);
  const freshAt = (value: string | null) => {
    const age = now - Date.parse(value ?? "");
    return Number.isFinite(age) && age >= 0 && age <= 30_000;
  };
  const freshOverview = !overviewUnavailable && freshAt(overview.generatedAt);
  const can = (permission: string) =>
    employee?.permissions.includes(permission) ?? false;
  const navigation = (label: string, href: string, permission: string) =>
    can(permission) ? (
      <Link className="overview-kpi-action" to={href}>
        {label}
        <ArrowUpRight aria-hidden="true" />
      </Link>
    ) : (
      <span className="overview-kpi-restriction">Sin permiso de consulta</span>
    );
  const serviceIds = useMemo(
    () =>
      overview.services
        .filter(
          (service) => !filters.serviceId || service.id === filters.serviceId,
        )
        .map((service) => service.id),
    [overview.services, filters.serviceId],
  );
  const period = OVERVIEW_PERIODS.find(
    (item) => item.value === filters.period,
  )!.label;
  const scope = filters.serviceId
    ? getServiceDisplayName(filters.serviceId)
    : "Todos los servicios";
  const usable = (query: QueryState<MetricSeries>) =>
    canReadMetrics &&
    !monitoringAccessDenied(query.error) &&
    query.data &&
    Number.isFinite(Date.parse(query.data.to))
      ? query.data
      : undefined;
  const latencyData = usable(metrics);
  const availabilityData = usable(availability);
  const probeLatency = useMemo(
    () => summarizeProbes(latencyData, serviceIds, "latency"),
    [latencyData, serviceIds],
  );
  const probeAvailability = useMemo(
    () => summarizeProbes(availabilityData, serviceIds, "availability"),
    [availabilityData, serviceIds],
  );
  const metricNotice = (
    query: QueryState<MetricSeries>,
    summary: typeof probeLatency,
  ) =>
    !canReadMetrics
      ? "Sin permiso de analítica"
      : monitoringAccessDenied(query.error)
        ? monitoringFailure(query.error).message
        : query.isError
          ? query.data
            ? "Última lectura · sin actualizar"
            : "No se pudo actualizar"
          : query.isPaused
            ? query.data
              ? "Última lectura · sin conexión"
              : "Consulta sin conexión"
            : query.isPending
              ? "Consultando muestras…"
              : query.data && !freshAt(query.data.to)
                ? "Dato desactualizado · último periodo recibido"
                : !usable(query)
                  ? "Sin muestras recientes"
                  : summary.truncated
                    ? `${summary.count} muestras · resultado truncado`
                    : !summary.count
                      ? "Sin observaciones"
                      : !summary.sufficient
                        ? `${summary.count} muestras · cobertura insuficiente`
                        : `${summary.count} muestras · cobertura suficiente`;
  const metricAction = (metric: "availability" | "latency") =>
    canReadMetrics ? (
      <button
        className="overview-kpi-action"
        type="button"
        onClick={() => setDetail(metric)}
      >
        Ver métricas
        <ArrowUpRight aria-hidden="true" />
      </button>
    ) : (
      <span className="overview-kpi-restriction">Sin permiso de analítica</span>
    );
  const states = overview.services.map((service) =>
    !service.monitoringEnabled || !freshAt(service.lastCheckedAt)
      ? "NO_DATA"
      : service.status,
  );
  const count = (state: string) =>
    states.filter((item) => item === state).length;
  const incidentsAvailable =
    freshOverview && overview.sources.incidents === "AVAILABLE";
  const highest = Object.keys(SEVERITIES).find((severity) =>
    overview.recentIncidents.some((incident) => incident.severity === severity),
  );
  const severityText =
    incidentsAvailable && overview.activeIncidentsCount > 0
      ? highest
        ? `${overview.activeIncidentsCount > overview.recentIncidents.length ? "Mayor visible" : "Criticidad máxima"}: ${SEVERITIES[highest]}`
        : "Criticidad no disponible"
      : incidentsAvailable
        ? "Sin incidentes abiertos"
        : "Estado sin actualizar";
  const http =
    canReadEndpoints && !endpoints.isError && !endpoints.isPaused
      ? summarizeHttpErrors(endpoints.data, now)
      : null;
  const httpNotice = !canReadEndpoints
    ? "Sin permiso de Endpoints"
    : endpoints.isError
      ? "No se pudo actualizar"
      : endpoints.isPaused
        ? "Consulta sin conexión"
        : endpoints.isPending
          ? "Consultando instrumentación…"
          : !http
            ? "Sin telemetría HTTP reciente"
            : !http.total
              ? "Sin endpoints instrumentados"
              : !http.measured
                ? "Sin tasas HTTP medidas"
                : http.server === null
                  ? "Sin tráfico medido en la ventana"
                  : `${http.measured}/${http.total} endpoints con tasas medidas${http.measured < http.total ? " · parcial" : ""}`;
  const selectedSummary =
    detail === "availability" ? probeAvailability : probeLatency;
  const selectedQuery = detail === "availability" ? availability : metrics;

  return (
    <>
      <ServiceKpiGrid
        className="dashboard-kpi-grid overview-kpis"
        ariaLabel="Indicadores principales"
      >
        <ServiceKpiCard
          label="Servicios"
          value={overview.monitoredServicesCount}
          description={
            freshOverview
              ? "Total supervisado · estado actual"
              : "Último total recibido · desactualizado"
          }
          icon={RadioTower}
          footer={navigation(
            "Abrir Servicios",
            PATHS.SERVICES,
            "services.read",
          )}
        >
          <dl className="overview-service-counts">
            {[
              ["Operativos", count("OPERATIONAL")],
              ["Degradados", count("DEGRADED") + count("RECOVERING")],
              ["No disponibles", count("UNAVAILABLE")],
              ["Sin datos", count("NO_DATA")],
            ].map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{freshOverview ? value : "—"}</dd>
              </div>
            ))}
          </dl>
        </ServiceKpiCard>
        <ServiceKpiCard
          label="Incidentes abiertos"
          value={
            overview.sources.incidents === "AVAILABLE"
              ? overview.activeIncidentsCount
              : "—"
          }
          description={severityText}
          icon={Siren}
          footer={navigation(
            "Ver activos",
            `${PATHS.INCIDENTS}?status=active`,
            "incidents.read",
          )}
        >
          <p className="overview-kpi-note">
            {incidentsAvailable
              ? "Actuales · excluye los históricos resueltos."
              : "Último conteo recibido; no confirma la situación actual."}
          </p>
        </ServiceKpiCard>
        <ServiceKpiCard
          label="Disponibilidad"
          value={formatRatio(probeAvailability.value)}
          description={`Sondas persistidas · ${period}`}
          icon={Activity}
          footer={metricAction("availability")}
        >
          <p className="overview-kpi-note">{scope}</p>
          <p className="overview-kpi-note">
            {metricNotice(availability, probeAvailability)}
          </p>
        </ServiceKpiCard>
        <ServiceKpiCard
          label="Latencia p95"
          value={
            probeLatency.value === null
              ? "—"
              : `${Math.round(probeLatency.value).toLocaleString("es-PE")} ms`
          }
          description={`Sondas persistidas · ${period}`}
          icon={Gauge}
          footer={metricAction("latency")}
        >
          <p className="overview-kpi-note">
            {scope} · no mide solicitudes bancarias.
          </p>
          <p className="overview-kpi-note">
            {metricNotice(metrics, probeLatency)}
          </p>
        </ServiceKpiCard>
        <ServiceKpiCard
          label="Errores HTTP 5xx"
          value={formatRatio(http?.server ?? null)}
          description={`Prometheus · ${endpoints.data ? `${endpoints.data.windowSeconds} s` : "ventana no disponible"} · global`}
          icon={CircleAlert}
          footer={navigation(
            "Abrir Endpoints",
            PATHS.ENDPOINTS,
            "analytics.read",
          )}
        >
          <p className="overview-kpi-note">
            4xx: {formatRatio(http?.client ?? null)} · separado de fallos 5xx.
          </p>
          <p className="overview-kpi-note">{httpNotice}</p>
        </ServiceKpiCard>
        <ServiceKpiCard
          label="Alertas pendientes"
          value="—"
          description="Reconocimiento no instrumentado"
          icon={Bell}
          footer={navigation(
            "Ver pendientes",
            `${PATHS.ALERTS}?status=pending`,
            "alerts.read",
          )}
        >
          <p className="overview-kpi-note">
            Cantidad y prioridad no disponibles.
          </p>
          <p className="overview-kpi-note">
            El total de alertas no equivale a pendientes.
          </p>
        </ServiceKpiCard>
      </ServiceKpiGrid>
      <Dialog
        open={detail !== null}
        onOpenChange={(open) => {
          if (!open) setDetail(null);
        }}
      >
        <DialogContent className="overview-metric-detail">
          <DialogHeader>
            <DialogTitle>
              {detail === "availability"
                ? "Disponibilidad por sondas"
                : "Latencia p95 de sondas"}
            </DialogTitle>
            <DialogDescription>
              {period} · {scope}. Fuente: health checks persistidos; no tráfico
              bancario HTTP.
            </DialogDescription>
          </DialogHeader>
          <p>{metricNotice(selectedQuery, selectedSummary)}</p>
          {usable(selectedQuery) ? (
            <p>
              Desde {timestamp(selectedQuery.data!.from)} hasta{" "}
              {timestamp(selectedQuery.data!.to)} PET.
            </p>
          ) : null}
          {usable(selectedQuery) ? (
            <div className="overview-metric-table">
              <table>
                <caption>Muestras y cobertura por servicio</caption>
                <thead>
                  <tr>
                    <th scope="col">Servicio</th>
                    <th scope="col">Muestras</th>
                    <th scope="col">Extensión temporal</th>
                    <th scope="col">Suficiencia</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedSummary.rows.map((row) => (
                    <tr key={row.id}>
                      <th scope="row">{getServiceDisplayName(row.id)}</th>
                      <td>{row.count}</td>
                      <td>
                        {row.count
                          ? `${Math.round(row.spanRatio * 100)} %`
                          : "—"}
                      </td>
                      <td>{row.sufficient ? "Suficiente" : "Insuficiente"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
          <p>
            Se requieren al menos 20 muestras por servicio, una extensión del 80
            % del periodo y sin huecos mayores al 10 % del periodo (mínimo de 30
            s). Una respuesta truncada no representa el periodo completo.
          </p>
          <p>
            Disponibilidad: sondas alcanzables / sondas observadas. p95:
            percentil por rango más próximo de las latencias observadas. Ambos
            agrupan muestras de los servicios seleccionados; no son un SLO ni un
            intervalo de confianza.
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
}
