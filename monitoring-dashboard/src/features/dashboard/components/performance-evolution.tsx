import { useEffect, useId, useMemo, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { PATHS } from "@/app/router/constants/paths";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePerformanceSelection } from "@/features/dashboard/hooks/use-performance-selection";
import type {
  DashboardOverview,
  MetricSeries,
} from "@/features/dashboard/types/dashboard.types";
import { OVERVIEW_PERIODS } from "@/features/dashboard/types/overview-filters.types";
import type { OverviewFilters } from "@/features/dashboard/types/overview-filters.types";
import {
  buildPerformanceSeries,
  PERFORMANCE_METRICS,
} from "@/features/dashboard/utils/performance-series";
import type { PerformanceMetric } from "@/features/dashboard/utils/performance-series";
import {
  OBSERVED_SERVICE_NAMES,
  serviceObservationTime,
} from "@/features/dashboard/utils/service-observation";
import { PerformanceTimeline } from "@/features/dashboard/components/performance-timeline";
import type { TimelineIncident } from "@/features/dashboard/components/performance-timeline";
import type { Incident } from "@/features/incidents/services/incidents.service";
import { PanelHeading } from "@/shared/components/panel-heading";
import { PanelSkeleton } from "@/shared/components/loading/module-skeleton";
import { readObservationRange } from "@/shared/utils/observation-range";
import "./performance-evolution.css";

interface Props {
  overview: DashboardOverview;
  filters: OverviewFilters;
  metrics: {
    data?: MetricSeries;
    isPending: boolean;
    isError: boolean;
    isPaused: boolean;
  };
  incidents: {
    data?: Incident[];
    dataUpdatedAt: number;
    isError: boolean;
    isPaused: boolean;
  };
  canReadMetrics: boolean;
  canReadServices: boolean;
  canReadIncidents: boolean;
  overviewUnavailable: boolean;
}

export function PerformanceEvolution({
  overview,
  filters,
  metrics,
  incidents,
  canReadMetrics,
  canReadServices,
  canReadIncidents,
  overviewUnavailable,
}: Props) {
  const { metric, setMetric, selectInterval } = usePerformanceSelection();
  const [params] = useSearchParams();
  const { search } = useLocation();
  const metricId = useId();
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(timer);
  }, []);
  const ids = useMemo(
    () =>
      overview.services
        .filter(
          (service) => !filters.serviceId || service.id === filters.serviceId,
        )
        .map((service) => service.id),
    [overview.services, filters.serviceId],
  );
  const series = useMemo(
    () => buildPerformanceSeries(metrics.data, ids, filters.period),
    [metrics.data, ids, filters.period],
  );
  const period = OVERVIEW_PERIODS.find(
    (item) => item.value === filters.period,
  )!.label;
  const service = filters.serviceId
    ? (OBSERVED_SERVICE_NAMES[filters.serviceId] ?? filters.serviceId)
    : "Todos los servicios";
  const current = series && now >= series.to && now - series.to <= 30_000;
  const selectedRange = readObservationRange(params);
  const selectedService = params.get("observationService") ?? "";
  const selected =
    selectedRange && ids.includes(selectedService)
      ? { ...selectedRange, serviceId: selectedService }
      : undefined;
  const context = new URLSearchParams(search);
  context.set("from", "overview");
  const detailHref = `${PATHS.SERVICE_DETAIL(selectedService)}?${context.toString()}`;
  const references = useMemo(() => {
    if (!series) return [];
    const records = new Map<string, TimelineIncident>();
    if (
      !overviewUnavailable &&
      now - Date.parse(overview.generatedAt) <= 30_000 &&
      overview.sources.incidents === "AVAILABLE"
    ) {
      overview.recentIncidents.forEach((incident) =>
        records.set(incident.id, {
          id: incident.id,
          serviceId: incident.serviceKey,
          openedAt: incident.openedAt,
        }),
      );
    }
    if (
      canReadIncidents &&
      !incidents.isError &&
      !incidents.isPaused &&
      now - incidents.dataUpdatedAt <= 30_000
    ) {
      incidents.data?.forEach((incident) =>
        records.set(incident.id, {
          id: incident.id,
          serviceId: incident.serviceKey,
          openedAt: incident.openedAt,
        }),
      );
    }
    return [...records.values()]
      .filter(
        (incident) =>
          ids.includes(incident.serviceId) &&
          Date.parse(incident.openedAt) >= series.from &&
          Date.parse(incident.openedAt) <= series.to,
      )
      .sort((a, b) => Date.parse(a.openedAt) - Date.parse(b.openedAt));
  }, [
    series,
    overview,
    overviewUnavailable,
    incidents.data,
    incidents.dataUpdatedAt,
    incidents.isError,
    incidents.isPaused,
    canReadIncidents,
    ids,
    now,
  ]);

  return (
    <section className="performance-panel" aria-labelledby="performance-title">
      <PanelHeading
        id="performance-title"
        title="Evolución del rendimiento"
        description={`${period} · ${service}`}
      >
        <div className="performance-control">
          <label htmlFor={metricId}>Métrica</label>
          <Select
            value={metric}
            onValueChange={(value) => setMetric(value as PerformanceMetric)}
          >
            <SelectTrigger id={metricId}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PERFORMANCE_METRICS.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label} ({item.unit})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </PanelHeading>
      {!canReadMetrics ? (
        <p className="performance-empty">
          Sin permiso para consultar métricas de rendimiento.
        </p>
      ) : metric !== "latency-p95" ? (
        <div className="performance-empty" role="status">
          <p>No hay métricas de tráfico disponibles para este periodo.</p>
          <p>
            {metric === "http-errors"
              ? "La historia de errores HTTP 5xx y 4xx no está disponible para el rango seleccionado."
              : "La historia de solicitudes por segundo no está disponible para el rango seleccionado."}
          </p>
          <Link to={`${PATHS.ENDPOINTS}?${search.replace(/^\?/, "")}`}>
            Consultar la ventana actual en Endpoints
            <ArrowUpRight aria-hidden="true" />
          </Link>
        </div>
      ) : !ids.length ? (
        <p className="performance-empty">
          El servicio seleccionado no está disponible en el resumen actual.
        </p>
      ) : metrics.isPending && !metrics.isPaused ? (
        <PanelSkeleton
          rows={4}
          label="Consultando historia de latencia de sondas"
        />
      ) : metrics.isError || metrics.isPaused ? (
        <p className="performance-empty" role="status">
          No se pudo actualizar la historia de sondas. Esto no confirma una
          caída del servicio.
        </p>
      ) : !series || !current ? (
        <p className="performance-empty">
          No hay observaciones recientes disponibles para este periodo.
        </p>
      ) : (
        <div className="performance-body">
          <p className="performance-source">
            Fuente: sondas persistidas · p95 por intervalos de{" "}
            {series.step / 60_000} min ·{" "}
            {serviceObservationTime(new Date(series.from).toISOString())} a{" "}
            {serviceObservationTime(new Date(series.to).toISOString())} PET.
          </p>
          {series.truncated ? (
            <p className="performance-note">
              Historia parcial: la consulta alcanzó el límite de 5.000
              observaciones. Los tramos ausentes no se completan.
            </p>
          ) : null}
          <PerformanceTimeline
            from={series.from}
            to={series.to}
            lines={series.lines}
            incidents={references}
            selected={selected}
            onSelect={selectInterval}
          />
          <p className="performance-note">
            p95 calculado con un mínimo de 20 sondas por intervalo; no mide
            solicitudes bancarias. Los cortes indican ausencia de p95, no cero.
            Umbral no disponible para esta fuente.
          </p>
          <p className="performance-note">
            Selecciona un punto para revisar su intervalo. Las aperturas de
            incidentes se relacionan por servicio y fecha; no demuestran
            causalidad. Referencias limitadas a los registros disponibles.
          </p>
          {selected ? (
            <div className="performance-selection" role="status">
              <p>
                Intervalo seleccionado:{" "}
                {OBSERVED_SERVICE_NAMES[selected.serviceId] ??
                  selected.serviceId}{" "}
                · {serviceObservationTime(selected.from)} a{" "}
                {serviceObservationTime(selected.to)} PET.
              </p>
              {canReadServices ? (
                <Link to={detailHref}>
                  Ver observaciones del intervalo
                  <ArrowUpRight aria-hidden="true" />
                </Link>
              ) : (
                <p>Sin permiso para abrir el detalle del servicio.</p>
              )}
            </div>
          ) : null}
          {references.length ? (
            <details className="performance-references">
              <summary>
                Incidentes relacionados en el periodo ({references.length})
              </summary>
              <ul>
                {references.map((incident) => {
                  const incidentParams = new URLSearchParams(search);
                  incidentParams.set("reference", incident.id);
                  incidentParams.delete("status");
                  return (
                    <li key={incident.id}>
                      {OBSERVED_SERVICE_NAMES[incident.serviceId] ??
                        incident.serviceId}{" "}
                      · apertura {serviceObservationTime(incident.openedAt)} PET{" "}
                      {canReadIncidents ? (
                        <Link
                          to={`${PATHS.INCIDENTS}?${incidentParams.toString()}`}
                        >
                          Ver incidente
                          <ArrowUpRight aria-hidden="true" />
                        </Link>
                      ) : (
                        "· Sin permiso de detalle"
                      )}
                    </li>
                  );
                })}
              </ul>
            </details>
          ) : null}
        </div>
      )}
    </section>
  );
}
