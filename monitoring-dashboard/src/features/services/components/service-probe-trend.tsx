import { Activity, Gauge, Minus } from 'lucide-react';

import { Panel } from '@/shared/components/panel';
import type { ServiceCheck } from '@/features/services/types/service.types';

interface ServiceProbeTrendProps {
  checks: ServiceCheck[];
  isLoading?: boolean;
}

function isSuccessful(status: string): boolean {
  return status === 'OPERATIONAL';
}

export function ServiceProbeTrend({ checks, isLoading = false }: ServiceProbeTrendProps) {
  const points = [...checks]
    .sort((left, right) => new Date(left.checkedAt).getTime() - new Date(right.checkedAt).getTime())
    .slice(-24);
  const latencies = points.map((check) => check.latencyMs);
  const highest = Math.max(...latencies, 0);
  const lowest = Math.min(...latencies, highest);
  const span = Math.max(highest - lowest, 1);
  const polyline = points.map((check, index) => {
    const x = points.length === 1 ? 50 : (index / (points.length - 1)) * 100;
    const y = 84 - ((check.latencyMs - lowest) / span) * 62;
    return `${x},${y}`;
  }).join(' ');
  const successful = points.filter((check) => isSuccessful(check.status)).length;
  const availability = points.length ? Math.round((successful / points.length) * 100) : null;

  return (
    <Panel className="service-probe-trend" variant="flat" ariaLabelledBy="service-probe-trend-title">
      <header className="service-probe-trend-header">
        <div>
          <p className="service-catalog-context-eyebrow">Señal de salud</p>
          <h2 id="service-probe-trend-title">Tendencia de sondas</h2>
          <p>Últimas {points.length || 0} comprobaciones. Esta señal no representa tráfico ni errores HTTP.</p>
        </div>
        <span>{isLoading ? 'Actualizando' : 'En vivo · 10 s'}</span>
      </header>
      {isLoading ? (
        <div className="service-probe-trend-empty">Cargando observaciones…</div>
      ) : points.length ? (
        <>
          <div className="service-probe-chart" aria-label="Gráfico de latencia de las últimas comprobaciones">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" role="img">
              <path className="service-probe-grid-line" d="M0 22H100M0 53H100M0 84H100" />
              <polyline className="service-probe-line" points={polyline} />
              {points.map((check, index) => {
                const x = points.length === 1 ? 50 : (index / (points.length - 1)) * 100;
                const y = 84 - ((check.latencyMs - lowest) / span) * 62;
                return <circle className={isSuccessful(check.status) ? 'is-success' : 'is-error'} cx={x} cy={y} key={check.id} r="2.2" />;
              })}
            </svg>
          </div>
          <footer className="service-probe-summary">
            <span><Gauge aria-hidden="true" /> Rango {lowest}–{highest} ms</span>
            <span><Activity aria-hidden="true" /> Disponibilidad observada {availability}%</span>
          </footer>
        </>
      ) : (
        <div className="service-probe-trend-empty"><Minus aria-hidden="true" /> Aún no hay observaciones para dibujar una tendencia.</div>
      )}
    </Panel>
  );
}
