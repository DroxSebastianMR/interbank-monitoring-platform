import type { DashboardOverview } from '@/features/dashboard/types/dashboard.types';

function formatPercent(value: number | null): string {
  return value === null ? 'Sin datos' : `${(value * 100).toFixed(1)} %`;
}

function formatLatency(value: number | null): string {
  return value === null ? 'Sin datos' : `${Math.round(value)} ms`;
}

export function OverviewIndicators({ overview }: { overview: DashboardOverview }) {
  const indicators = [
    ['Estado general', overview.overallStatus],
    ['Servicios supervisados', String(overview.monitoredServicesCount)],
    ['Incidentes activos', String(overview.activeIncidentsCount)],
    ['Alertas activas', String(overview.activeAlertsCount)],
    ['Disponibilidad de sondas', formatPercent(overview.availability)],
    ['Latencia p95 de sondas', formatLatency(overview.latencyP95Ms)],
    ['Errores HTTP', formatPercent(overview.errorRate)],
    ['Actualidad de datos', overview.dataFreshness],
  ];
  return <div className="metrics metrics-eight">
    {indicators.map(([label, value]) => <article key={label}><span>{label}</span><strong>{value}</strong></article>)}
  </div>;
}
