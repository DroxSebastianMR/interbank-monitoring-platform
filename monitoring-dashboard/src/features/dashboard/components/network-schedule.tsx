import { ArrowDownRight, ArrowRight, ArrowUpRight, ChartNoAxesCombined } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PATHS } from '@/app/router/constants/paths';
import type { MetricSeries } from '@/features/dashboard/types/dashboard.types';
import type { MonitoredService } from '@/features/services/types/service.types';
import { SERVICE_STATUS_META } from '@/features/services/constants/service-status';
import { PanelHeading } from '@/shared/components/panel-heading';
import { Panel } from '@/shared/components/panel';
import { formatClockTime } from '@/shared/utils/format';

function pointsForService(points: MetricSeries['points'], serviceId: string) {
  return points
    .filter((point) => point.serviceId === serviceId)
    .sort((first, second) => Date.parse(first.timestamp) - Date.parse(second.timestamp))
    .slice(-12);
}

function trend(points: MetricSeries['points']) {
  if (points.length < 2) return { Icon: ChartNoAxesCombined, label: 'Sin historial', tone: 'neutral' as const };
  const delta = points.at(-1)!.value - points.at(-2)!.value;
  if (delta > 20) return { Icon: ArrowUpRight, label: `+${Math.round(delta)} ms`, tone: 'rising' as const };
  if (delta < -20) return { Icon: ArrowDownRight, label: `${Math.round(delta)} ms`, tone: 'falling' as const };
  return { Icon: ArrowRight, label: 'Estable', tone: 'steady' as const };
}

function sparklinePoints(points: MetricSeries['points']) {
  if (points.length < 2) return '';

  const values = points.map((point) => point.value);
  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  const range = Math.max(maximum - minimum, 1);

  return points.map((point, index) => {
    const x = (index / (points.length - 1)) * 112;
    const y = 28 - ((point.value - minimum) / range) * 24;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
}

export function NetworkSchedule({
  services,
  metrics,
}: {
  services: MonitoredService[];
  metrics: MetricSeries['points'];
}) {
  return (
    <Panel className="schedule-panel" ariaLabelledBy="schedule-title" variant="flat">
      <PanelHeading
        id="schedule-title"
        title={<Link className="panel-title-link" to={PATHS.SERVICES}>Servicios digitales · supervisión en tiempo real <ArrowUpRight aria-hidden="true" /></Link>}
        description="Estado actual y tendencia de las últimas comprobaciones"
      >
        <div className="schedule-heading-meta">
          <span className="schedule-count">{services.length} servicios</span>
          <span className="live-chip"><i /> En vivo</span>
        </div>
      </PanelHeading>
      <div className="realtime-table-scroll">
        <table className="realtime-table" aria-label="Estado y latencia de servicios supervisados">
          <caption className="sr-only">Estado, latencia, última comprobación y tendencia reciente de cada servicio</caption>
          <tbody>
              {services.map((service) => {
                const servicePoints = pointsForService(metrics, service.id);
                const hasCurrentTelemetry = service.status !== 'NO_DATA' && service.latencyMs !== null;
                const displayPoints = hasCurrentTelemetry ? servicePoints : [];
                const { Icon: TrendIcon, label: trendLabel, tone } = trend(displayPoints);
                const latestSample = displayPoints.at(-1);
                const line = sparklinePoints(displayPoints);
                return (
                  <tr className={`realtime-row status-${service.status.toLowerCase()}`} key={service.id}>
                    <th scope="row">
                      <Link className="realtime-service" to={PATHS.SERVICE_DETAIL(service.id)}>
                        <span><strong>{service.name}</strong><small>Servicio supervisado</small></span>
                        <ArrowUpRight aria-hidden="true" />
                      </Link>
                    </th>
                    <td><span className="realtime-status"><i aria-hidden="true" />{SERVICE_STATUS_META[service.status].label}</span></td>
                    <td><strong className="realtime-metric">{hasCurrentTelemetry ? `${Math.round(service.latencyMs!)} ms` : '—'}</strong></td>
                    <td><span className="realtime-check">{service.lastCheckedAt ? formatClockTime(service.lastCheckedAt) : 'Sin observar'}</span></td>
                    <td>
                      <div className={`realtime-observation tone-${tone}`}>
                        {line ? (
                          <svg className="realtime-sparkline" viewBox="0 0 112 32" role="img" aria-label={`Tendencia de ${servicePoints.length} muestras de latencia`}>
                            <path className="realtime-sparkline-baseline" d="M0 28H112" />
                            <polyline points={line} />
                            <circle cx={line.split(' ').at(-1)?.split(',')[0]} cy={line.split(' ').at(-1)?.split(',')[1]} r="2.5" />
                          </svg>
                        ) : (
                          <span className="realtime-no-history" aria-label="Aún no hay suficientes muestras para mostrar una tendencia">—</span>
                        )}
                        <span className="realtime-trend"><TrendIcon aria-hidden="true" />{trendLabel}</span>
                        {latestSample && <small className="realtime-sample-time">Muestra {formatClockTime(latestSample.timestamp)}</small>}
                      </div>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}
