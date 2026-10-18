import { ArrowDownRight, ArrowRight, ArrowUpRight } from 'lucide-react';
import type { CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { PATHS } from '@/app/router/constants/paths';
import type { MetricSeries } from '@/features/dashboard/types/dashboard.types';
import type { MonitoredService } from '@/features/services/types/service.types';
import { SERVICE_STATUS_META } from '@/features/services/constants/service-status';
import { PanelHeading } from '@/shared/components/panel-heading';
import { formatClockTime } from '@/shared/utils/format';

function pointsForService(points: MetricSeries['points'], serviceId: string) {
  return points.filter((point) => point.serviceId === serviceId).slice(-4);
}

function trend(points: MetricSeries['points']) {
  if (points.length < 2) return { Icon: ArrowRight, label: 'Estable' };
  const delta = points.at(-1)!.value - points.at(-2)!.value;
  if (delta > 20) return { Icon: ArrowUpRight, label: 'En aumento' };
  if (delta < -20) return { Icon: ArrowDownRight, label: 'En descenso' };
  return { Icon: ArrowRight, label: 'Estable' };
}

function samplesForService(points: MetricSeries['points'], serviceId: string, fallback: number | null) {
  const samples = pointsForService(points, serviceId);
  return samples.length ? samples : [{ value: fallback ?? 0 }];
}

export function NetworkSchedule({
  services,
  metrics,
}: {
  services: MonitoredService[];
  metrics: MetricSeries['points'];
}) {
  return (
    <section className="schedule-panel" aria-labelledby="schedule-title">
      <PanelHeading
        id="schedule-title"
        title={<Link className="panel-title-link" to={PATHS.SERVICES}>Supervisión en tiempo real <ArrowUpRight aria-hidden="true" /></Link>}
        description="Latencia y estado de cada servicio"
      >
        <div className="schedule-heading-meta">
          <span className="schedule-count">{services.length} servicios</span>
          <span className="live-chip"><i /> En vivo</span>
        </div>
      </PanelHeading>
      <div className="realtime-table-scroll">
        <table className="realtime-table" aria-label="Estado y latencia de servicios supervisados">
          <caption className="sr-only">Estado, latencia, revisión y observaciones recientes de cada servicio</caption>
          <tbody>
              {services.map((service) => {
                const servicePoints = pointsForService(metrics, service.id);
                const samples = samplesForService(metrics, service.id, service.latencyMs);
                const peak = Math.max(...samples.map((point) => point.value), 1);
                const { Icon: TrendIcon, label: trendLabel } = trend(servicePoints);
                return (
                  <tr className={`realtime-row status-${service.status.toLowerCase()}`} key={service.id}>
                    <th scope="row">
                      <Link className="realtime-service" to={PATHS.SERVICE_DETAIL(service.id)}>
                        <span><strong>{service.name}</strong><small>Servicio supervisado</small></span>
                        <ArrowUpRight aria-hidden="true" />
                      </Link>
                    </th>
                    <td><span className="realtime-status"><i aria-hidden="true" />{SERVICE_STATUS_META[service.status].label}</span></td>
                    <td><strong className="realtime-metric">{service.latencyMs == null ? '—' : `${Math.round(service.latencyMs)} ms`}</strong></td>
                    <td><span className="realtime-check">{service.lastCheckedAt ? formatClockTime(service.lastCheckedAt) : 'Sin observar'}</span></td>
                    <td>
                      <div className="realtime-observation">
                        <span className="realtime-bars" aria-label={`${samples.length} observaciones recientes`}>
                          {samples.map((point, index) => (
                            <i
                              key={`${service.id}-${index}`}
                              aria-hidden="true"
                              style={{ '--sample-height': `${Math.max(22, Math.round((point.value / peak) * 100))}%` } as CSSProperties}
                            />
                          ))}
                        </span>
                        <span className="realtime-trend"><TrendIcon aria-hidden="true" />{trendLabel}</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
