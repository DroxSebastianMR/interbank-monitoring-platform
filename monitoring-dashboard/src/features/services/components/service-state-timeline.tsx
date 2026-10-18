import { ArrowRight, Clock3 } from 'lucide-react';

import { ServiceStatusBadge } from '@/features/services/components/service-status-badge';
import type { ServiceStateChange } from '@/features/services/types/service.types';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDateTime } from '@/shared/utils/format';

interface ServiceStateTimelineProps {
  changes: ServiceStateChange[];
  isLoading?: boolean;
  isError?: boolean;
}

function formatRelativeTime(value: string): string {
  const elapsedSeconds = Math.round((new Date(value).getTime() - Date.now()) / 1000);
  const formatter = new Intl.RelativeTimeFormat('es-PE', { numeric: 'auto' });
  const ranges = [
    { limit: 60, divisor: 1, unit: 'second' as const },
    { limit: 3_600, divisor: 60, unit: 'minute' as const },
    { limit: 86_400, divisor: 3_600, unit: 'hour' as const },
    { limit: 2_592_000, divisor: 86_400, unit: 'day' as const },
    { limit: Number.POSITIVE_INFINITY, divisor: 2_592_000, unit: 'month' as const },
  ];
  const range = ranges.find((item) => Math.abs(elapsedSeconds) < item.limit) ?? ranges[4];
  return formatter.format(Math.round(elapsedSeconds / range.divisor), range.unit);
}

export function ServiceStateTimeline({ changes, isLoading = false, isError = false }: ServiceStateTimelineProps) {
  return (
    <section className="service-operation-card service-state-card" aria-labelledby="service-state-title">
      <header className="service-operation-header">
        <div className="service-operation-heading">
          <div>
            <h2 id="service-state-title">Cambios de estado</h2>
            <p>Evolución reciente de la disponibilidad</p>
          </div>
        </div>
        <span className="service-operation-count">{changes.length} transiciones</span>
      </header>

      {isLoading ? (
        <div className="service-operation-skeleton" role="status" aria-label="Cargando cambios de estado">
          {Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} />)}
        </div>
      ) : isError ? (
        <p className="service-operation-message is-error" role="alert">No se pudo consultar el historial de estados.</p>
      ) : changes.length === 0 ? (
        <p className="service-operation-message">Aún no se registraron transiciones para este servicio.</p>
      ) : (
        <ol className="service-state-timeline">
          {changes.map((change, index) => (
            <li key={change.id} className="service-state-event">
              <span className="service-state-marker" aria-hidden="true" />
              <div className="service-state-event-body">
                <div className="service-state-transition">
                  <ServiceStatusBadge status={change.fromStatus} showIcon={false} />
                  <ArrowRight aria-hidden="true" />
                  <ServiceStatusBadge status={change.toStatus} />
                </div>
                <div className="service-state-time" title={formatDateTime(change.changedAt)}>
                  <Clock3 aria-hidden="true" />
                  <span>{formatRelativeTime(change.changedAt)}</span>
                  {index === 0 && <strong>Más reciente</strong>}
                </div>
                {change.reason && <p className="service-state-reason">{change.reason}</p>}
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
