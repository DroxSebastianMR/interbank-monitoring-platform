import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from "react-router-dom";
import { useAuth } from '@/app/providers/auth/use-auth';
import { PATHS } from '@/app/router/constants/paths';
import { servicesService } from '@/features/services/services/services.service';
import { ServiceActions } from '@/features/services/forms/service-actions';

export function ServiceDetailPage() {
  const { id = "" } = useParams();
  const { employee } = useAuth();
  const service = useQuery({
    queryKey: ["monitored-service", id],
    queryFn: () => servicesService.detail(id),
    enabled: !!id,
    refetchInterval: 10_000,
  });
  const checks = useQuery({
    queryKey: ["monitored-service-checks", id],
    queryFn: () => servicesService.checks(id),
    enabled: !!id,
    refetchInterval: 10_000,
  });
  const stateHistory = useQuery({
    queryKey: ["monitored-service-state-history", id],
    queryFn: () => servicesService.stateHistory(id),
    enabled: !!id,
    refetchInterval: 10_000,
  });
  const configHistory = useQuery({
    queryKey: ["monitored-service-config-history", id],
    queryFn: () => servicesService.configHistory(id),
    enabled: !!id,
  });
  const instances = useQuery({
    queryKey: ["monitored-service-instances", id],
    queryFn: () => servicesService.instances(id),
    enabled: !!id,
    refetchInterval: 10_000,
  });
  if (service.isLoading)
    return <div className="notice">Cargando servicio…</div>;
  if (service.isError || !service.data)
    return (
      <div role="alert" className="notice error">
        No se pudo consultar este servicio.
      </div>
    );
  const current = service.data;
  return (
    <section>
      <Link to={PATHS.SERVICES}>← Volver a servicios</Link>
      <div className="section-title">
        <h2>{current.name}</h2>
        <span className={`status ${current.status.toLowerCase()}`}>
          {current.status}
        </span>
      </div>
      <div className="metrics">
        <article>
          <span>Criticidad</span>
          <strong>{current.criticality ?? "Sin datos"}</strong>
        </article>
        <article>
          <span>Riesgo de anomalía IA</span>
          <strong>{current.riskLevel ?? "Sin datos"}</strong>
        </article>
        <article>
          <span>Latencia última sonda</span>
          <strong>
            {current.latencyMs == null
              ? "Sin datos"
              : `${current.latencyMs} ms`}
          </strong>
        </article>
        <article>
          <span>Supervisión</span>
          <strong>
            {current.monitoringEnabled === false ? "Pausada" : "Activa"}
          </strong>
        </article>
      </div>
      {employee?.permissions.includes("services.manage") && (
        <ServiceActions
          key={`${current.id}-${current.version}`}
          service={current}
        />
      )}
      <div className="section-title">
        <h2>Historial de comprobaciones</h2>
      </div>
      {checks.isLoading ? (
        <div className="notice">Cargando observaciones…</div>
      ) : checks.isError ? (
        <div role="alert" className="notice error">
          No se pudo cargar el historial.
        </div>
      ) : checks.data?.length ? (
        <div className="table-card table-scroll">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Estado</th>
                <th>Latencia</th>
                <th>Resultado</th>
              </tr>
            </thead>
            <tbody>
              {checks.data.map((check) => (
                <tr key={check.id}>
                  <td>{new Date(check.checkedAt).toLocaleString("es-PE")}</td>
                  <td>{check.status}</td>
                  <td>{check.latencyMs} ms</td>
                  <td>{check.message ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="notice">Aún no hay comprobaciones registradas.</div>
      )}
      <div className="dashboard-columns">
        <section className="table-card">
          <h2>Cambios de estado</h2>
          {stateHistory.isError ? (
            <p role="alert">No se pudo consultar el historial.</p>
          ) : stateHistory.data?.length ? (
            <ul>
              {stateHistory.data.map((change) => (
                <li key={change.id}>
                  {change.fromStatus} → {change.toStatus} ·{" "}
                  {new Date(change.changedAt).toLocaleString("es-PE")}
                  {change.reason ? ` · ${change.reason}` : ""}
                </li>
              ))}
            </ul>
          ) : (
            <p>Sin transiciones registradas.</p>
          )}
        </section>
        <section className="table-card">
          <h2>Instancias del laboratorio</h2>
          {instances.isError ? (
            <p role="alert">No se pudo consultar la topología.</p>
          ) : (
            <>
              {!instances.data?.instrumented && (
                <p>Estado individual no instrumentado; no se infiere salud de NGINX.</p>
              )}
              <ul>
                {instances.data?.instances.map((instance) => (
                  <li key={instance.id}>
                    {instance.id} · {instance.status}
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      </div>
      <section className="table-card">
        <h2>Historial de configuración</h2>
        {configHistory.isError ? (
          <p role="alert">No se pudo consultar la auditoría.</p>
        ) : configHistory.data?.length ? (
          <ul>
            {configHistory.data.map((change) => (
              <li key={change.id}>
                {change.action} · {new Date(change.createdAt).toLocaleString("es-PE")}
              </li>
            ))}
          </ul>
        ) : (
          <p>Sin cambios administrativos registrados.</p>
        )}
      </section>
    </section>
  );
}
