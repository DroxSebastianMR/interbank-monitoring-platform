import { Link } from "react-router-dom";
import type { MonitoredService } from '@/features/services/types/service.types';
import { PATHS } from '@/app/router/constants/paths';

export function ServiceTable({ services }: { services: MonitoredService[] }) {
  return (
    <div className="table-card table-scroll">
      <table>
        <thead>
          <tr>
            <th>Servicio</th>
            <th>Estado</th>
            <th>Criticidad</th>
            <th>Latencia</th>
            <th>Última comprobación</th>
          </tr>
        </thead>
        <tbody>
          {services.map((service) => (
            <tr key={service.id}>
              <td>
                <Link to={PATHS.SERVICE_DETAIL(service.id)}>
                  <strong>{service.name}</strong>
                </Link>
                <small>{service.message}</small>
              </td>
              <td>
                <span className={`status ${service.status.toLowerCase()}`}>
                  {service.status}
                </span>
              </td>
              <td>{service.criticality ?? "—"}</td>
              <td>
                {service.latencyMs == null
                  ? "Sin datos"
                  : `${service.latencyMs} ms`}
              </td>
              <td>
                {service.lastCheckedAt
                  ? new Date(service.lastCheckedAt).toLocaleString("es-PE")
                  : "Sin observaciones"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
