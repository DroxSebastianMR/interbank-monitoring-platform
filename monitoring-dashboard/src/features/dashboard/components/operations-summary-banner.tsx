import { ArrowRight, RefreshCw, Server, ShieldAlert, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

import { PATHS } from '@/app/router/constants/paths';
import type { DashboardOverview } from '@/features/dashboard/types/dashboard.types';
import { getServiceDisplayName, translateOperationalMessage } from '@/features/dashboard/utils/operational-copy';

interface OperationsSummaryBannerProps {
  overview: DashboardOverview;
  isFetching: boolean;
  onRefresh: () => void;
}

const SEVERITY_LABELS: Record<string, string> = {
  CRITICAL: 'Crítica',
  HIGH: 'Alta',
  MEDIUM: 'Media',
  LOW: 'Baja',
};

function relativeTime(value: string): string {
  const elapsedMinutes = Math.round((new Date(value).getTime() - Date.now()) / 60_000);
  const formatter = new Intl.RelativeTimeFormat('es-PE', { numeric: 'auto' });
  if (Math.abs(elapsedMinutes) < 60) return formatter.format(elapsedMinutes, 'minute');
  return formatter.format(Math.round(elapsedMinutes / 60), 'hour');
}

export function OperationsSummaryBanner({ overview, isFetching, onRefresh }: OperationsSummaryBannerProps) {
  const incident = overview.recentIncidents[0];
  const incidentTone = incident ? `severity-${incident.severity.toLowerCase()}` : '';

  return (
    <section className={`operations-summary-banner ${incident ? `has-incident ${incidentTone}` : 'is-calm'}`} aria-live="polite">
      <header className="operations-summary-header">
        <div className="operations-summary-label">
          {!incident && <span className="operations-summary-mark" aria-hidden="true"><ShieldCheck /></span>}
          <span className="operations-summary-eyebrow">{incident ? 'Incidente prioritario' : 'Operación estable'}</span>
        </div>
        {incident && <span className="operations-summary-opened">Abierto {relativeTime(incident.openedAt)}</span>}
      </header>

      <div className="operations-summary-copy">
        <strong>{incident ? translateOperationalMessage(incident.title, incident.serviceKey) : 'No hay incidentes activos'}</strong>
        <p>{incident ? 'Requiere revisión del equipo de operaciones.' : 'Monitoreo continuo sin eventos abiertos.'}</p>
      </div>

      <footer className="operations-summary-footer">
        <div className="operations-summary-context">
          {incident ? (
            <>
              <span><Server aria-hidden="true" /><span><b>Servicio</b>{getServiceDisplayName(incident.serviceKey)}</span></span>
              <span><ShieldAlert aria-hidden="true" /><span><b>Severidad</b>{SEVERITY_LABELS[incident.severity] ?? incident.severity}</span></span>
            </>
          ) : (
            <p>La última observación no reporta eventos abiertos que requieran intervención.</p>
          )}
        </div>
        <div className="operations-summary-actions">
          {incident ? (
            <Link to={PATHS.INCIDENTS}><span>Revisar incidente</span><ArrowRight aria-hidden="true" /></Link>
          ) : (
            <button type="button" onClick={onRefresh} disabled={isFetching}>
              <RefreshCw className={isFetching ? 'spin' : ''} aria-hidden="true" /> Actualizar
            </button>
          )}
        </div>
      </footer>
    </section>
  );
}
