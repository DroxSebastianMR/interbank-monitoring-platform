import { useEffect, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { PATHS } from "@/app/router/constants/paths";
import type { DashboardTopology } from "@/features/dashboard/types/dashboard.types";
import { infrastructureState } from "@/features/dashboard/utils/infrastructure-state";
import { serviceObservationTime } from "@/features/dashboard/utils/service-observation";
import { SERVICE_STATUS_META } from "@/features/services/constants/service-status";
import { PanelHeading } from "@/shared/components/panel-heading";
import "./overview-bottom.css";

export function InfrastructureTopology({
  topology,
  unavailable,
  loading,
  canReadMetrics,
}: {
  topology?: DashboardTopology;
  unavailable: boolean;
  loading: boolean;
  canReadMetrics: boolean;
}) {
  const { search } = useLocation();
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(timer);
  }, []);
  const { components, redundancy } = infrastructureState(
    topology,
    unavailable,
    now,
  );
  const instanceHref = (id?: string) => {
    const params = new URLSearchParams(search);
    if (id) params.set("instance", id);
    else params.delete("instance");
    return `${PATHS.ENDPOINTS}${params.size ? `?${params.toString()}` : ""}`;
  };
  return (
    <section
      className="overview-infrastructure overview-bottom-panel"
      aria-labelledby="infrastructure-title"
    >
      <PanelHeading
        id="infrastructure-title"
        title="Infraestructura"
        description="Observaciones independientes por componente."
      />
      {loading ? (
        <p className="overview-bottom-message" role="status">
          Consultando componentes…
        </p>
      ) : unavailable ? (
        <p className="overview-bottom-message" role="status">
          No se pudo actualizar la infraestructura. Su estado actual no está
          comprobado.
        </p>
      ) : null}
      <div
        className="infrastructure-table-scroll"
        tabIndex={0}
        role="region"
        aria-label="Componentes de infraestructura"
      >
        <table className="infrastructure-table">
          <caption className="sr-only">
            El estado de NGINX no confirma la disponibilidad de las instancias
            ni de los servicios bancarios.
          </caption>
          <thead>
            <tr>
              <th scope="col">Componente</th>
              <th scope="col">Estado comprobado</th>
              <th scope="col">Última observación</th>
            </tr>
          </thead>
          <tbody>
            {components.map((component) => {
              const meta = SERVICE_STATUS_META[component.status];
              const Icon = meta.icon;
              return (
                <tr key={component.id}>
                  <th scope="row">
                    {component.id !== "nginx" && canReadMetrics ? (
                      <Link
                        to={instanceHref(component.id)}
                        aria-label={`Ver métricas técnicas de ${component.label}`}
                      >
                        {component.label}
                        <ArrowUpRight aria-hidden="true" />
                      </Link>
                    ) : (
                      component.label
                    )}
                    <small>{component.note}</small>
                  </th>
                  <td>
                    <span
                      className={`infrastructure-status infrastructure-status--${component.status.toLowerCase()}`}
                    >
                      <Icon aria-hidden="true" />
                      {meta.label}
                    </span>
                  </td>
                  <td>
                    {component.observedAt ? (
                      <time dateTime={component.observedAt}>
                        {serviceObservationTime(component.observedAt)}
                        <small>PET</small>
                      </time>
                    ) : (
                      "Sin datos"
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <footer className="overview-bottom-footer">
        <p>{redundancy}</p>
        <p>
          La observación del gateway no representa la disponibilidad global.
        </p>
        {canReadMetrics ? (
          <Link to={instanceHref()}>
            Ver infraestructura
            <ArrowUpRight aria-hidden="true" />
          </Link>
        ) : (
          <p>Sin permiso para consultar métricas de instancias.</p>
        )}
        <small>
          Acceso a métricas de instancias. Vista integral de infraestructura
          pendiente.
        </small>
      </footer>
    </section>
  );
}
