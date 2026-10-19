import { useEffect, useState } from "react";
import { CircleAlert } from "lucide-react";
import { monitoringFailure } from "@/features/dashboard/utils/dashboard-data-state";
import { monitoringAccessDenied } from "@/features/dashboard/utils/dashboard-data-state";
import { serviceObservationTime } from "@/features/dashboard/utils/service-observation";
import type { MonitoringSource } from "@/features/dashboard/types/monitoring-source.types";
import "./dashboard-data-notice.css";

export function DashboardDataNotice({
  sources,
  online,
  lastUpdated,
  refreshing,
  onRetry,
}: {
  sources: MonitoringSource[];
  online: boolean;
  lastUpdated?: string;
  refreshing: boolean;
  onRetry: () => void;
}) {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(timer);
  }, []);
  const problems = sources.filter(
    (source) =>
      source.allowed &&
      (source.error ||
        source.isPaused ||
        (source.hasData && now - Date.parse(source.observedAt ?? "") > 30_000)),
  );
  if (online && !problems.length) return null;
  return (
    <aside
      className="dashboard-data-notice"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <div>
        <CircleAlert aria-hidden="true" />
        <strong>
          {!online
            ? "Sin conexión. Datos desactualizados."
            : problems.length ===
                sources.filter((source) => source.allowed).length
              ? "No se pudieron actualizar las fuentes."
              : "Actualización parcial."}
        </strong>
      </div>
      <p>
        Se conservan los últimos datos válidos disponibles. Su presencia no
        confirma el estado bancario actual.
      </p>
      {lastUpdated && Number.isFinite(Date.parse(lastUpdated)) ? (
        <p>
          Último resumen recibido:{" "}
          <time dateTime={lastUpdated}>
            {serviceObservationTime(lastUpdated)} PET
          </time>
          .
        </p>
      ) : null}
      <ul>
        {problems.map((source) => (
          <li key={source.id}>
            <strong>{source.label}:</strong>{" "}
            {source.error || source.isPaused
              ? monitoringFailure(source.error, source.isPaused).message
              : "Lectura desactualizada."}
            {monitoringAccessDenied(source.error)
              ? " Los datos almacenados de esta fuente no se muestran."
              : source.hasData
                ? " Se conserva la última lectura."
                : " Sin lectura válida disponible."}
          </li>
        ))}
      </ul>
      <button type="button" onClick={onRetry} disabled={refreshing}>
        {refreshing ? "Reintentando…" : "Reintentar fuentes"}
      </button>
    </aside>
  );
}
