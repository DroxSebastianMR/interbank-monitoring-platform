import { OperationalHeader } from "@/features/dashboard/components/operational-header";
import { OverviewIndicators } from "@/features/dashboard/components/overview-indicators";
import { OperationsSummaryBanner } from "@/features/dashboard/components/operations-summary-banner";
import { InfrastructureTopology } from "@/features/dashboard/components/infrastructure-topology";
import { HistoricalActivity } from "@/features/dashboard/components/historical-activity";
import { NetworkSchedule } from "@/features/dashboard/components/network-schedule";
import { RecentSignals } from "@/features/dashboard/components/recent-signals";
import { PerformanceEvolution } from "@/features/dashboard/components/performance-evolution";
import { useOverviewFilters } from "@/features/dashboard/hooks/use-overview-filters";
import { useDashboardQueries } from "@/features/dashboard/hooks/use-dashboard-queries";
import { DashboardSkeleton } from "@/shared/components/loading/module-skeleton";
import { ErrorState } from "@/shared/components/error-state";
import { EmptyState } from "@/shared/components/empty-state";
import { Link } from "react-router-dom";
import { PATHS } from "@/app/router/constants/paths";
import { DashboardDataNotice } from "@/features/dashboard/components/dashboard-data-notice";
import {
  monitoringFailure,
  monitoringAccessDenied,
} from "@/features/dashboard/utils/dashboard-data-state";

export function DashboardPage() {
  const { filters, setPeriod, setService } = useOverviewFilters();
  const queries = useDashboardQueries(filters);
  const { overview, metrics, topology, canReadOverview, canReadMetrics } =
    queries;
  const data = overview.data;
  const denied = monitoringAccessDenied(overview.error);
  const failure =
    overview.isError || overview.isPaused
      ? monitoringFailure(overview.error, overview.isPaused)
      : undefined;
  const monitorUnavailable =
    !queries.online || overview.isError || overview.isPaused;
  const services =
    data?.services.filter(
      (service) => !filters.serviceId || service.id === filters.serviceId,
    ) ?? [];

  return (
    <section className="dashboard-page">
      <OperationalHeader
        overview={denied ? undefined : data}
        filters={filters}
        onPeriod={setPeriod}
        onService={setService}
        isFetching={queries.isFetching}
        refreshing={queries.refreshing}
        message={queries.refreshMessage}
        canReadOverview={queries.overviewAllowed}
      />
      {denied ? (
        <section className="dashboard-access-state" role="alert">
          <h2>
            {failure?.state === "unauthorized"
              ? "Sesión no autorizada"
              : "Acceso denegado"}
          </h2>
          <p>{failure?.message}</p>
          {failure?.state === "unauthorized" ? (
            <Link to={PATHS.LOGIN}>Iniciar sesión</Link>
          ) : (
            <button type="button" onClick={() => void queries.refresh()}>
              Volver a consultar el acceso
            </button>
          )}
        </section>
      ) : !canReadOverview ? (
        <ErrorState>
          No tienes permiso para consultar la Vista general. Solicita acceso al
          administrador.
        </ErrorState>
      ) : !data ? (
        overview.isPending && !overview.isPaused && queries.online ? (
          <DashboardSkeleton />
        ) : (
          <>
            <DashboardDataNotice
              sources={queries.sources}
              online={queries.online}
              refreshing={queries.refreshing}
              onRetry={() => void queries.refresh()}
            />
            {failure?.state === "incompatible" ? (
              <section className="dashboard-access-state" role="status">
                <h2>Contrato de monitoreo no disponible</h2>
                <p>{failure.message}</p>
                <p>
                  Esta vista requiere un Monitoring Backend compatible. No se
                  interpretan estas respuestas como una caída bancaria.
                </p>
                <button type="button" onClick={() => void queries.refresh()}>
                  Reintentar
                </button>
              </section>
            ) : (
              <OperationsSummaryBanner
                disconnected
                isFetching={overview.isFetching}
                onRefresh={() => void queries.refresh()}
              />
            )}
          </>
        )
      ) : (
        <>
          <DashboardDataNotice
            sources={queries.sources}
            online={queries.online}
            lastUpdated={data.generatedAt}
            refreshing={queries.refreshing}
            onRetry={() => void queries.refresh()}
          />
          <OperationsSummaryBanner
            overview={data}
            disconnected={monitorUnavailable}
            isFetching={overview.isFetching}
            onRefresh={() => void queries.refresh()}
          />
          <OverviewIndicators
            overview={data}
            overviewUnavailable={monitorUnavailable}
            filters={filters}
            metrics={metrics}
            availability={queries.availability}
            endpoints={queries.endpoints}
            canReadMetrics={canReadMetrics}
            canReadEndpoints={queries.canReadEndpoints}
          />
          <div className="dashboard-workspace">
            {!queries.selectedServiceExists ? (
              <EmptyState>
                <p>
                  El servicio seleccionado no está disponible en el resumen
                  actual.
                </p>
                <button type="button" onClick={() => setService("")}>
                  Ver todos los servicios
                </button>
              </EmptyState>
            ) : (
              <div className="overview-supervision">
                <NetworkSchedule
                  services={services}
                  monitorUnavailable={monitorUnavailable}
                  observations={queries.serviceObservations.data}
                  observationsUnavailable={
                    queries.serviceObservations.isError ||
                    queries.serviceObservations.isPaused
                  }
                  observationsUpdatedAt={
                    queries.serviceObservations.dataUpdatedAt
                  }
                  canReadServices={queries.canReadServices}
                  filters={filters}
                  metrics={metrics.data}
                  metricsUnavailable={metrics.isError || metrics.isPaused}
                  metricsPending={metrics.isPending}
                  canReadMetrics={canReadMetrics}
                />
              </div>
            )}
            <RecentSignals
              overview={data}
              overviewUnavailable={monitorUnavailable}
              incidents={queries.attentionIncidents.data}
              incidentsUnavailable={
                queries.attentionIncidents.isError ||
                queries.attentionIncidents.isPaused
              }
              incidentsPending={queries.attentionIncidents.isPending}
              incidentsUpdatedAt={queries.attentionIncidents.dataUpdatedAt}
              canReadIncidents={queries.canReadIncidents}
              serviceId={filters.serviceId}
            />
          </div>
          <PerformanceEvolution
            overview={data}
            filters={filters}
            metrics={metrics}
            incidents={queries.attentionIncidents}
            canReadMetrics={canReadMetrics}
            canReadServices={queries.canReadServices}
            canReadIncidents={queries.canReadIncidents}
            overviewUnavailable={monitorUnavailable}
          />
          <div className="overview-bottom-grid">
            <InfrastructureTopology
              topology={topology.data}
              unavailable={topology.isError || topology.isPaused}
              loading={topology.isPending && !topology.isPaused}
              canReadMetrics={canReadMetrics}
            />
            <HistoricalActivity
              filters={filters}
              incidents={queries.attentionIncidents}
              alerts={queries.historicalAlerts}
              histories={queries.stateHistories}
              canReadIncidents={queries.canReadIncidents}
              canReadAlerts={queries.canReadAlerts}
              canReadServices={queries.canReadServices}
            />
          </div>
        </>
      )}
    </section>
  );
}

