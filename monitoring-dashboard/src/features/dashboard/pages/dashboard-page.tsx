import { useQuery } from "@tanstack/react-query";
import { useAuth } from '@/app/providers/auth/use-auth';
import { useOverview } from '@/features/dashboard/hooks/use-overview';
import { dashboardService } from '@/features/dashboard/services/dashboard.service';
import { OverviewIndicators } from '@/features/dashboard/components/overview-indicators';
import { OperationsSummaryBanner } from '@/features/dashboard/components/operations-summary-banner';
import { InfrastructureTopology } from '@/features/dashboard/components/infrastructure-topology';
import { NetworkSchedule } from '@/features/dashboard/components/network-schedule';
import { RecentSignals } from '@/features/dashboard/components/recent-signals';
import { DashboardSkeleton, PanelSkeleton } from '@/shared/components/loading/module-skeleton';
import { ErrorState } from '@/shared/components/error-state';

export function DashboardPage() {
  const { employee } = useAuth();
  const { data, isLoading, isError, isFetching, refetch } = useOverview();
  const canReadMetrics =
    employee?.permissions.includes("analytics.read") ?? false;
  const metrics = useQuery({
    queryKey: ["dashboard-metrics", "latency"],
    queryFn: () => dashboardService.metrics('latency'),
    enabled: canReadMetrics,
    refetchInterval: 10_000,
  });
  const activity = useQuery({
    queryKey: ["dashboard-activity"],
    queryFn: dashboardService.activity,
    refetchInterval: 10_000,
  });
  const topology = useQuery({
    queryKey: ["dashboard-topology"],
    queryFn: dashboardService.topology,
    staleTime: 60_000,
  });
  if (isLoading) return <DashboardSkeleton />;
  if (isError || !data)
    return (
      <ErrorState onRetry={() => void refetch()}>
        No se pudo consultar el Monitoring Backend. La conectividad del panel no
        indica por sí misma una caída bancaria.
      </ErrorState>
    );
  return (
    <section className="dashboard-page">
      <OperationsSummaryBanner
        overview={data}
        isFetching={isFetching}
        onRefresh={() => void refetch()}
      />
      <OverviewIndicators overview={data} />
      <div className="dashboard-workspace">
        <NetworkSchedule services={data.services.map((service) => ({ ...service, message: service.monitoringEnabled ? '' : 'Supervisión pausada' }))} metrics={canReadMetrics && !metrics.isError ? metrics.data?.points ?? [] : []} />
        <RecentSignals items={activity.data ?? []} isError={activity.isError} isLoading={activity.isLoading} />
      </div>
      {topology.isError ? (
        <section className="notice error" role="alert">
          No se pudo cargar la topología de infraestructura.
        </section>
      ) : topology.data ? (
        <InfrastructureTopology topology={topology.data} />
      ) : (
        <PanelSkeleton rows={3} label="Consultando topología de infraestructura" />
      )}
    </section>
  );
}
