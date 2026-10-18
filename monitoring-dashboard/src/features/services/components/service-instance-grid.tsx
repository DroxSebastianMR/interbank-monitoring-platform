import { Clock3, Server, TriangleAlert } from 'lucide-react';

import { ServiceStatusBadge } from '@/features/services/components/service-status-badge';
import type { ServiceInstances } from '@/features/services/types/service.types';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDateTime } from '@/shared/utils/format';

interface ServiceInstanceGridProps {
  data?: ServiceInstances;
  isLoading?: boolean;
  isError?: boolean;
}

export function ServiceInstanceGrid({ data, isLoading = false, isError = false }: ServiceInstanceGridProps) {
  const instances = data?.instances ?? [];
  const reporting = instances.filter((instance) => instance.status !== 'NO_DATA').length;

  return (
    <section className="service-operation-card" aria-labelledby="service-instances-title">
      <header className="service-operation-header">
        <div className="service-operation-heading">
          <div>
            <h2 id="service-instances-title">Instancias del laboratorio</h2>
            <p>Disponibilidad individual de la topología</p>
          </div>
        </div>
        <span className="service-operation-count is-instance">{reporting} de {instances.length} reportando</span>
      </header>

      {isLoading ? (
        <div className="service-instance-skeleton" role="status" aria-label="Cargando instancias">
          {Array.from({ length: 2 }).map((_, index) => <Skeleton key={index} />)}
        </div>
      ) : isError ? (
        <p className="service-operation-message is-error" role="alert">No se pudo consultar la topología.</p>
      ) : (
        <>
          {!data?.instrumented && (
            <div className="service-instrumentation-notice" role="note">
              <TriangleAlert aria-hidden="true" />
              <p><strong>Telemetría limitada</strong><span>El estado individual todavía no está instrumentado; no se infiere la salud desde NGINX.</span></p>
            </div>
          )}
          {instances.length === 0 ? (
            <p className="service-operation-message">No hay instancias reportadas para este servicio.</p>
          ) : (
            <div className="service-instance-grid">
              {instances.map((instance) => (
                <article className="service-instance-item" key={instance.id}>
                  <div className="service-instance-name">
                    <span aria-hidden="true"><Server /></span>
                    <div><strong>{instance.id}</strong><small>Instancia supervisada</small></div>
                  </div>
                  <ServiceStatusBadge status={instance.status} />
                  <p title={instance.lastObservedAt ? formatDateTime(instance.lastObservedAt) : undefined}>
                    <Clock3 aria-hidden="true" />
                    {instance.lastObservedAt ? `Observada ${formatDateTime(instance.lastObservedAt)}` : 'Sin observaciones recientes'}
                  </p>
                </article>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}
