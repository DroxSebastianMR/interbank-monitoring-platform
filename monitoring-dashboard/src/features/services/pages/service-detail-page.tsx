import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useSearchParams } from "react-router-dom";
import { BrainCircuit, Gauge, RadioTower, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/app/providers/auth/use-auth';
import { servicesService } from '@/features/services/services/services.service';
import { ServiceActions } from '@/features/services/forms/service-actions';
import { ServiceStatusBadge } from '@/features/services/components/service-status-badge';
import { ServiceKpiCard, ServiceKpiGrid } from '@/features/services/components/service-kpi-card';
import { ServiceCheckHistory } from '@/features/services/components/service-check-history';
import { ServiceConfigHistory } from '@/features/services/components/service-config-history';
import { ServiceInstanceGrid } from '@/features/services/components/service-instance-grid';
import { ServiceStateTimeline } from '@/features/services/components/service-state-timeline';
import { getCriticalityLabel, getRiskLevelLabel } from '@/features/services/constants/service.constants';
import { useModuleHeader } from '@/layouts/operations/module-header-context';
import { DetailSkeleton, PanelSkeleton } from '@/shared/components/loading/module-skeleton';
import { ErrorState } from '@/shared/components/error-state';
import { readObservationRange } from '@/shared/utils/observation-range';

export function ServiceDetailPage() {
  const { id = "" } = useParams();
  const [params] = useSearchParams();
  const overviewPeriod = params.get('from') === 'overview'
    ? (['15m', '1h', '6h', '24h'] as const).find((period) => period === params.get('period')) ?? '1h'
    : undefined;
  const observationRange = overviewPeriod && params.get('observationService') === id ? readObservationRange(params) : undefined;
  const { employee } = useAuth();
  const service = useQuery({
    queryKey: ["monitored-service", id],
    queryFn: () => servicesService.detail(id),
    enabled: !!id,
    refetchInterval: 10_000,
  });
  const checks = useQuery({
    queryKey: ["monitored-service-checks", id],
    queryFn: () => servicesService.checks(id),
    enabled: !!id,
    refetchInterval: 10_000,
  });
  const stateHistory = useQuery({
    queryKey: ["monitored-service-state-history", id],
    queryFn: () => servicesService.stateHistory(id),
    enabled: !!id,
    refetchInterval: 10_000,
  });
  const configHistory = useQuery({
    queryKey: ["monitored-service-config-history", id],
    queryFn: () => servicesService.configHistory(id),
    enabled: !!id,
  });
  const instances = useQuery({
    queryKey: ["monitored-service-instances", id],
    queryFn: () => servicesService.instances(id),
    enabled: !!id,
    refetchInterval: 10_000,
  });
  const { setModuleChild, setModuleActions } = useModuleHeader();
  const childName = service.data?.name ?? null;
  const childStatus = service.data?.status ?? null;
  useEffect(() => {
    setModuleChild(childName);
    return () => setModuleChild(null);
  }, [childName, setModuleChild]);
  useEffect(() => {
    setModuleActions(
      childStatus ? <ServiceStatusBadge status={childStatus} showIcon={false} /> : null,
    );
    return () => setModuleActions(null);
  }, [childStatus, setModuleActions]);
  if (service.isLoading) return <DetailSkeleton />;
  if (service.isError || !service.data)
    return <ErrorState>No se pudo consultar este servicio.</ErrorState>;
  const current = service.data;
  return (
    <section>
      <ServiceKpiGrid>
        <ServiceKpiCard
          label="Latencia última sonda"
          value={current.latencyMs == null ? "Sin datos" : `${current.latencyMs} ms`}
          description={current.latencyMs == null ? 'Esperando una observación' : 'Tiempo de respuesta más reciente'}
          icon={Gauge}
          tone={current.latencyMs == null ? 'neutral' : current.latencyMs > 1000 ? 'critical' : 'success'}
        />
        <ServiceKpiCard
          label="Supervisión"
          value={current.monitoringEnabled === false ? "Pausada" : "Activa"}
          description={current.monitoringEnabled === false ? 'Las sondas están detenidas' : 'Comprobación automática habilitada'}
          icon={RadioTower}
          tone={current.monitoringEnabled === false ? 'warning' : 'success'}
        />
        <ServiceKpiCard
          label="Criticidad"
          value={getCriticalityLabel(current.criticality)}
          description="Prioridad operativa del servicio"
          icon={ShieldCheck}
          tone={current.criticality === 'CRITICAL' || current.criticality === 'HIGH' ? 'critical' : 'info'}
        />
        <ServiceKpiCard
          label="Riesgo de anomalía IA"
          value={getRiskLevelLabel(current.riskLevel)}
          description="Evaluación del último análisis"
          icon={BrainCircuit}
          tone={current.riskLevel === 'HIGH' ? 'critical' : current.riskLevel === 'MEDIUM' ? 'warning' : current.riskLevel === 'LOW' ? 'success' : 'neutral'}
        />
      </ServiceKpiGrid>
      {employee?.permissions.includes("services.manage") && (
        <ServiceActions
          key={`${current.id}-${current.version}`}
          service={current}
        />
      )}
      {checks.isLoading ? (
        <PanelSkeleton rows={5} label="Cargando observaciones" />
      ) : checks.isError ? (
        <ErrorState>No se pudo cargar el historial.</ErrorState>
      ) : (
        <ServiceCheckHistory
          key={`${id}-${overviewPeriod ?? 'default'}-${observationRange?.from ?? ''}-${observationRange?.to ?? ''}`}
          checks={checks.data ?? []}
          serviceName={current.name}
          updatedAt={checks.dataUpdatedAt}
          initialPeriod={overviewPeriod}
          observationRange={observationRange}
        />
      )}
      <div className="dashboard-columns">
        <ServiceStateTimeline
          reference={params.get('stateReference') ?? undefined}
          changes={stateHistory.data ?? []}
          isLoading={stateHistory.isLoading}
          isError={stateHistory.isError}
        />
        <ServiceInstanceGrid
          data={instances.data}
          isLoading={instances.isLoading}
          isError={instances.isError}
        />
      </div>
      <ServiceConfigHistory
        changes={configHistory.data ?? []}
        isLoading={configHistory.isLoading}
        isError={configHistory.isError}
      />
    </section>
  );
}
