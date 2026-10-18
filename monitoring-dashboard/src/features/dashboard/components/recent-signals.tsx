import { ArrowUpRight, BellRing, CircleAlert, Siren } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PATHS } from '@/app/router/constants/paths';
import type { ActivityItem } from '@/features/dashboard/types/dashboard.types';
import { getServiceDisplayName, translateOperationalMessage } from '@/features/dashboard/utils/operational-copy';
import { PanelSkeleton } from '@/shared/components/loading/module-skeleton';
import { PanelHeading } from '@/shared/components/panel-heading';
import { EmptyState } from '@/shared/components/empty-state';
import { formatTime } from '@/shared/utils/format';

function signalIcon(item: ActivityItem) {
  if (item.type === 'INCIDENT') return item.severity === 'CRITICAL' ? Siren : CircleAlert;
  return BellRing;
}

const SEVERITY_LABELS: Record<string, string> = {
  CRITICAL: 'Crítica',
  HIGH: 'Alta',
  MEDIUM: 'Media',
  LOW: 'Baja',
};

export function RecentSignals({ items, isError, isLoading = false }: { items: ActivityItem[]; isError: boolean; isLoading?: boolean }) {
  if (isLoading) return <PanelSkeleton rows={4} label="Cargando señales recientes" />;
  return (
    <section className="signals-panel" aria-labelledby="signals-title">
      <PanelHeading
        id="signals-title"
        title={<Link className="panel-title-link" to={PATHS.INCIDENTS}>Señales recientes <ArrowUpRight aria-hidden="true" /></Link>}
        description="Incidentes y alertas por orden cronológico"
      >
        <span className="signal-count">{items.length} eventos</span>
      </PanelHeading>
      {isError ? <EmptyState className="panel-message">No se pudo cargar la actividad.</EmptyState> : items.length ? (
        <ol className="signal-list" aria-label="Actividad operativa reciente">
          {items.map((item, index) => {
            const Icon = signalIcon(item);
            const signalType = item.type === 'INCIDENT' ? 'Incidente' : 'Alerta';
            const severity = item.severity ? SEVERITY_LABELS[item.severity] ?? item.severity : 'Informativa';
            return (
              <li key={`${item.type}-${item.id}`} className={`signal-item type-${item.type.toLowerCase()} severity-${item.severity?.toLowerCase() ?? 'info'}`}>
                <Link className="signal-link" to={PATHS.INCIDENTS}>
                  <span className="signal-rail" aria-hidden="true">
                    <span className="signal-marker"><Icon /></span>
                  </span>
                  <span className="signal-content">
                    <span className="signal-meta">
                      <span className="signal-type">{signalType}</span>
                      <time dateTime={item.timestamp}>{formatTime(item.timestamp)}</time>
                      {index === 0 && <em>Más reciente</em>}
                    </span>
                    <strong>{translateOperationalMessage(item.description, item.serviceId)}</strong>
                    <small>{getServiceDisplayName(item.serviceId)} <i aria-hidden="true" /> Severidad {severity}</small>
                  </span>
                  <ArrowUpRight className="signal-open" aria-hidden="true" />
                </Link>
              </li>
            );
          })}
        </ol>
      ) : <EmptyState className="panel-message">Sin incidentes ni alertas recientes.</EmptyState>}
    </section>
  );
}
