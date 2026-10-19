import { ChevronDown, Clock3, UserRound } from 'lucide-react';

import type { ServiceConfigChange } from '@/features/services/types/service.types';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDateTime } from '@/shared/utils/format';

interface ServiceConfigHistoryProps {
  changes: ServiceConfigChange[];
  isLoading?: boolean;
  isError?: boolean;
}

const ACTION_LABELS: Record<string, string> = {
  SERVICE_CREATED: 'Servicio registrado',
  SERVICE_UPDATED: 'Configuración actualizada',
  SERVICE_PAUSED: 'Supervisión pausada',
  SERVICE_RESUMED: 'Supervisión reanudada',
};

const FIELD_LABELS: Record<string, string> = {
  reason: 'Motivo',
  name: 'Nombre',
  endpoint: 'Ruta de salud',
  criticality: 'Criticidad',
  expectedVersion: 'Versión modificada',
};

function getActionTone(action: string): string {
  if (action === 'SERVICE_PAUSED') return 'is-warning';
  if (action === 'SERVICE_RESUMED') return 'is-success';
  if (action === 'SERVICE_CREATED') return 'is-info';
  return 'is-neutral';
}

function readableValue(value: unknown): string {
  if (value == null || value === '') return 'Sin valor';
  if (typeof value === 'boolean') return value ? 'Sí' : 'No';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

export function ServiceConfigHistory({ changes, isLoading = false, isError = false }: ServiceConfigHistoryProps) {
  return (
    <section className="service-operation-card service-config-card" aria-labelledby="service-config-title">
      <header className="service-operation-header">
        <div className="service-operation-heading">
          <div>
            <h2 id="service-config-title">Historial de configuración</h2>
            <p>Trazabilidad de las acciones administrativas</p>
          </div>
        </div>
        <span className="service-operation-count is-config">{changes.length} movimientos</span>
      </header>

      {isLoading ? (
        <div className="service-config-skeleton" role="status" aria-label="Cargando historial de configuración">
          {Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} />)}
        </div>
      ) : isError ? (
        <p className="service-operation-message is-error" role="alert">No se pudo consultar la auditoría.</p>
      ) : changes.length === 0 ? (
        <p className="service-operation-message">Aún no hay cambios administrativos registrados.</p>
      ) : (
        <div className="service-config-list">
          {changes.map((change) => {
            const details = Object.entries(change.metadata ?? {}).filter(([, value]) => value !== undefined);
            return (
              <article className="service-config-entry" key={change.id}>
                <div className="service-config-entry-main">
                  <span className={`service-config-action ${getActionTone(change.action)}`}>
                    {ACTION_LABELS[change.action] ?? change.action}
                  </span>
                  <div className="service-config-meta">
                    <span title={change.actorId ?? undefined}><UserRound aria-hidden="true" />{change.actorId ? `Usuario ${change.actorId.slice(0, 8)}` : 'Sistema'}</span>
                    <span title={formatDateTime(change.createdAt)}><Clock3 aria-hidden="true" />{formatDateTime(change.createdAt)}</span>
                  </div>
                </div>
                {details.length > 0 ? (
                  <details className="service-config-details">
                    <summary>Ver cambios <ChevronDown aria-hidden="true" /></summary>
                    <dl>
                      {details.map(([field, value]) => (
                        <div key={field}><dt>{FIELD_LABELS[field] ?? field}</dt><dd>{readableValue(value)}</dd></div>
                      ))}
                    </dl>
                  </details>
                ) : <span className="service-config-no-details">Sin detalle adicional</span>}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
