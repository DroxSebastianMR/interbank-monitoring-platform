import { Clock3, FlaskConical } from "lucide-react";
import { useEffect, useId, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { DashboardOverview } from "@/features/dashboard/types/dashboard.types";
import { OVERVIEW_PERIODS } from "@/features/dashboard/types/overview-filters.types";
import type {
  OverviewFilters,
  OverviewPeriod,
} from "@/features/dashboard/types/overview-filters.types";
import "./operational-header.css";

interface Props {
  overview?: DashboardOverview;
  filters: OverviewFilters;
  onPeriod: (period: OverviewPeriod) => void;
  onService: (service: string) => void;
  isFetching: boolean;
  refreshing: boolean;
  message: string;
  canReadOverview: boolean;
}

function timestamp(value?: string | null) {
  if (!value || !Number.isFinite(Date.parse(value))) return null;
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

export function OperationalHeader({
  overview,
  filters,
  onPeriod,
  onService,
  isFetching,
  refreshing,
  message,
  canReadOverview,
}: Props) {
  const id = useId();
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 10_000);
    return () => window.clearInterval(timer);
  }, []);
  const updated = timestamp(overview?.generatedAt);
  const observed = overview?.lastObservationAt
    ? Date.parse(overview.lastObservationAt)
    : NaN;
  const noObservations =
    !Number.isFinite(observed) || overview?.dataFreshness === "NO_DATA";
  const stale =
    !noObservations &&
    (overview?.dataFreshness === "STALE" || now - observed > 30_000);
  const services = [...(overview?.services ?? [])].sort((a, b) =>
    a.name.localeCompare(b.name, "es"),
  );
  const unknownService =
    !!filters.serviceId &&
    !services.some((item) => item.id === filters.serviceId);

  return (
    <header
      className="operational-header"
      aria-labelledby={`${id}-title`}
      aria-busy={isFetching || refreshing}
    >
      <div className="operational-header-heading">
        <div>
          <h1 id={`${id}-title`}>Resumen operativo</h1>
          <p>Estado de los servicios bancarios supervisados.</p>
        </div>
        <span className="operational-environment">
          <FlaskConical aria-hidden="true" />
          Entorno: <strong>Laboratorio</strong>
        </span>
      </div>
      <div className="operational-header-toolbar">
        <div className="operational-update">
          <Clock3 aria-hidden="true" />
          <div>
            <span className="operational-control-label">
              Última actualización
            </span>
            {updated ? (
              <time dateTime={overview!.generatedAt}>
                {updated} <span>PET (UTC−5)</span>
              </time>
            ) : (
              <span className="operational-time-empty">
                Sin actualización recibida
              </span>
            )}
          </div>
        </div>
        <div
          className="operational-filters"
          role="group"
          aria-label="Filtros de Vista general"
        >
          <div className="operational-filter">
            <label id={`${id}-period-label`} htmlFor={`${id}-period`}>
              Periodo
            </label>
            <Select
              value={filters.period}
              onValueChange={(value) => onPeriod(value as OverviewPeriod)}
              disabled={!canReadOverview}
            >
              <SelectTrigger
                id={`${id}-period`}
                aria-labelledby={`${id}-period-label`}
                className="operational-select"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {OVERVIEW_PERIODS.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="operational-filter operational-service-filter">
            <label id={`${id}-service-label`} htmlFor={`${id}-service`}>
              Servicio
            </label>
            <Select
              value={filters.serviceId || "__all__"}
              onValueChange={(value) =>
                onService(value === "__all__" ? "" : value)
              }
              disabled={!canReadOverview || !overview}
            >
              <SelectTrigger
                id={`${id}-service`}
                aria-labelledby={`${id}-service-label`}
                className="operational-select"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Todos los servicios</SelectItem>
                {unknownService ? (
                  <SelectItem value={filters.serviceId} disabled>
                    Servicio no disponible ({filters.serviceId})
                  </SelectItem>
                ) : null}
                {services.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      <div className="operational-header-context">
        {overview ? (
          <span
            className={`operational-freshness${stale || noObservations ? " is-delayed" : ""}`}
            title={
              timestamp(overview.lastObservationAt)
                ? `Última observación: ${timestamp(overview.lastObservationAt)} PET`
                : undefined
            }
          >
            {noObservations
              ? "Sin observaciones"
              : stale
                ? "Observaciones desactualizadas"
                : "Observaciones recientes"}
          </span>
        ) : null}
      </div>
      <p
        className="operational-refresh-feedback"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {message}
      </p>
    </header>
  );
}

