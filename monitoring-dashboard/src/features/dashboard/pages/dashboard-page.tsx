import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from '@/app/providers/auth/use-auth';
import { useOverview } from '@/features/dashboard/hooks/use-overview';
import { dashboardService } from '@/features/dashboard/services/dashboard.service';
import { OverviewIndicators } from '@/features/dashboard/components/overview-indicators';
import { ServiceTable } from '@/features/services/components/service-table';
import { PATHS } from '@/app/router/constants/paths';

export function DashboardPage() {
  const { employee } = useAuth();
  const { data, isLoading, isError, isFetching, refetch } = useOverview();
  const canReadMetrics =
    employee?.permissions.includes("analytics.read") ?? false;
  const metrics = useQuery({
    queryKey: ["dashboard-metrics", "latency"],
    queryFn: () => dashboardService.metrics('latency'),
    enabled: canReadMetrics,
    refetchInterval: 10_000,
  });
  const activity = useQuery({
    queryKey: ["dashboard-activity"],
    queryFn: dashboardService.activity,
    refetchInterval: 10_000,
  });
  const topology = useQuery({
    queryKey: ["dashboard-topology"],
    queryFn: dashboardService.topology,
    staleTime: 60_000,
  });
  if (isLoading)
    return <div className="notice">Consultando el estado del monitor…</div>;
  if (isError || !data)
    return (
      <div role="alert" className="notice error">
        No se pudo consultar el Monitoring Backend. La conectividad del panel no
        indica por sí misma una caída bancaria.{" "}
        <button onClick={() => void refetch()}>Reintentar</button>
      </div>
    );
  return (
    <section>
      <div className="section-title">
        <div>
          <p className="eyebrow">CENTRO DE MONITOREO</p>
          <h2>Resumen global</h2>
        </div>
        <div>
          <span>
            {data.environment} ·{" "}
            {data.lastObservationAt
              ? `Última observación ${new Date(data.lastObservationAt).toLocaleString("es-PE")}`
              : "Sin observaciones"}
          </span>{" "}
          <button onClick={() => void refetch()} disabled={isFetching}>
            Actualizar
          </button>
        </div>
      </div>
      {data.dataFreshness !== "CURRENT" && (
        <div className="notice" role="status">
          Los datos del monitor están{" "}
          {data.dataFreshness === "STALE" ? "vencidos" : "pendientes"}. No se
          asume disponibilidad ni caída sin evidencia reciente.
        </div>
      )}
      <OverviewIndicators overview={data} />
      <div className="section-title">
        <h2>Servicios digitales</h2>
        <Link to={PATHS.SERVICES}>Ver todos</Link>
      </div>
      <ServiceTable
        services={data.services.map((service) => ({
          ...service,
          message: service.monitoringEnabled ? "" : "Supervisión pausada",
        }))}
      />
      <div className="dashboard-columns">
        <section className="table-card chart-card">
          <h2>Latencia de comprobaciones</h2>
          {!canReadMetrics ? (
            <p>No tienes permiso para consultar métricas.</p>
          ) : metrics.isError ? (
            <p>No se pudo cargar la serie temporal.</p>
          ) : metrics.data?.points.length ? (
            <div
              className="chart-bars"
              role="img"
              aria-label="Latencia reciente de las comprobaciones en milisegundos"
            >
              {metrics.data.points.slice(-24).map((point, index) => (
                <span
                  key={`${point.timestamp}-${point.serviceId}-${index}`}
                  title={`${point.serviceId}: ${point.value} ms · ${new Date(point.timestamp).toLocaleTimeString("es-PE")}`}
                  style={{
                    height: `${Math.max(6, Math.min(100, (point.value / Math.max(1, ...metrics.data!.points.slice(-24).map((item) => item.value))) * 100))}%`,
                  }}
                />
              ))}
            </div>
          ) : (
            <p>No hay observaciones para este periodo.</p>
          )}
        </section>
        <section className="table-card">
          <h2>Actividad reciente</h2>
          {activity.isError ? (
            <p>No se pudo cargar la actividad.</p>
          ) : activity.data?.length ? (
            <ul>
              {activity.data.slice(0, 5).map((item) => (
                <li key={`${item.type}-${item.id}`}>
                  {item.description} ·{" "}
                  {new Date(item.timestamp).toLocaleString("es-PE")}
                </li>
              ))}
            </ul>
          ) : (
            <p>Sin actividad registrada.</p>
          )}
        </section>
      </div>
      <div className="dashboard-columns">
        <section className="table-card">
          <h2>Incidentes recientes</h2>
          {data.recentIncidents.length ? (
            <ul>
              {data.recentIncidents.map((incident) => (
                <li key={incident.id}>
                  {incident.title} · {incident.severity}
                </li>
              ))}
            </ul>
          ) : (
            <p>Sin incidentes activos.</p>
          )}
        </section>
        <section className="table-card">
          <h2>Alertas recientes</h2>
          {data.recentAlerts.length ? (
            <ul>
              {data.recentAlerts.map((alert) => (
                <li key={alert.id}>{alert.message}</li>
              ))}
            </ul>
          ) : (
            <p>Sin alertas activas.</p>
          )}
        </section>
      </div>
      <section className="table-card">
        <h2>Infraestructura configurada</h2>
        <p>La topología representa conexiones configuradas, no confirma que una instancia esté activa.</p>
        {topology.isError ? (
          <p role="alert">No se pudo cargar la topología.</p>
        ) : topology.data ? (
          <ul>
            {topology.data.nodes.map((node) => (
              <li key={node.id}>{node.id} · {node.kind} · {node.status}</li>
            ))}
          </ul>
        ) : (
          <p>Consultando topología…</p>
        )}
      </section>
    </section>
  );
}
