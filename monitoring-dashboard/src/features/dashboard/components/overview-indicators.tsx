import type { DashboardOverview } from '@/features/dashboard/types/dashboard.types';
import { Activity, Gauge, RadioTower, Siren } from 'lucide-react';
import { getServiceStatusLabel } from '@/features/services/constants/service-status';
import { ServiceKpiCard, ServiceKpiGrid } from '@/features/services/components/service-kpi-card';

function formatPercent(value: number | null): string {
  return value === null ? 'Sin datos' : `${(value * 100).toFixed(1)} %`;
}

function formatLatency(value: number | null): string {
  return value === null ? 'Sin datos' : `${Math.round(value)} ms`;
}

export function OverviewIndicators({ overview }: { overview: DashboardOverview }) {
  const statusTone = overview.overallStatus === 'OPERATIONAL'
    ? 'success'
    : overview.overallStatus === 'UNAVAILABLE'
      ? 'critical'
      : overview.overallStatus === 'NO_DATA'
        ? 'neutral'
        : 'warning';

  return (
    <ServiceKpiGrid className="dashboard-kpi-grid" ariaLabel="Resumen operacional">
      <ServiceKpiCard
        label="Estado general"
        value={getServiceStatusLabel(overview.overallStatus)}
        description={`${overview.operationalCount} operativos · ${overview.degradedCount} degradados`}
        icon={RadioTower}
        tone={statusTone}
      />
      <ServiceKpiCard
        label="Disponibilidad"
        value={formatPercent(overview.availability)}
        description={overview.errorRate == null ? 'Errores HTTP sin instrumentar' : `${formatPercent(overview.errorRate)} de errores HTTP`}
        icon={Activity}
        tone={overview.availability == null ? 'neutral' : overview.availability < 0.99 ? 'warning' : 'success'}
      />
      <ServiceKpiCard
        label="Latencia P95"
        value={formatLatency(overview.latencyP95Ms)}
        description="Percentil 95 de las comprobaciones"
        icon={Gauge}
        tone={overview.latencyP95Ms == null ? 'neutral' : overview.latencyP95Ms > 1_000 ? 'critical' : overview.latencyP95Ms > 500 ? 'warning' : 'info'}
      />
      <ServiceKpiCard
        label="Incidentes activos"
        value={String(overview.activeIncidentsCount)}
        description={`${overview.activeAlertsCount} alertas requieren revisión`}
        icon={Siren}
        tone={overview.activeIncidentsCount > 0 ? 'critical' : overview.activeAlertsCount > 0 ? 'warning' : 'success'}
      />
    </ServiceKpiGrid>
  );
}
