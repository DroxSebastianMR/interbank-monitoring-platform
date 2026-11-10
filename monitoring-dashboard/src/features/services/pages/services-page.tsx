import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Activity, ArrowUpRight, Gauge, Plus, RefreshCw, ServerCog, ShieldAlert, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/app/providers/auth/use-auth';
import { PATHS } from '@/app/router/constants/paths';
import { Button as ActionButton } from '@/components/ui/button';
import { ServiceTable } from '@/features/services/components/service-table';
import { CreateServiceForm } from '@/features/services/forms/create-service-form';
import { useServices } from '@/features/services/hooks/use-services';
import { servicesService } from '@/features/services/services/services.service';
import { ServiceKpiCard, ServiceKpiGrid } from '@/features/services/components/service-kpi-card';
import { getServiceStatusLabel } from '@/features/services/constants/service-status';
import type { ServiceConfigInput, ServiceStatus } from '@/features/services/types/service.types';
import { useServiceFiltersStore } from '@/features/services/store/service-filters.store';
import {
  CRITICALITY_FILTER_OPTIONS,
  LATENCY_FILTER_OPTIONS,
  SERVICE_STATUS_FILTER_OPTIONS,
} from '@/features/services/constants/service.constants';
import { Input } from '@/components/ui/heroui-input';
import { Button } from '@/components/ui/heroui-button';
import { Modal } from '@/components/ui/heroui-modal';
import { Label, ListBox, Select } from '@/components/ui/heroui-select';
import { TableSkeleton } from '@/shared/components/loading/module-skeleton';
import { EmptyState } from '@/shared/components/empty-state';
import { ErrorState } from '@/shared/components/error-state';
import { Panel } from '@/shared/components/panel';

const STATUS_ORDER: ServiceStatus[] = [
  'OPERATIONAL',
  'DEGRADED',
  'UNAVAILABLE',
  'RECOVERING',
  'NO_DATA',
];

function getLatencyTone(latencyMs: number | null): 'success' | 'warning' | 'critical' | 'neutral' {
  if (latencyMs === null) return 'neutral';
  if (latencyMs >= 1000) return 'critical';
  if (latencyMs >= 500) return 'warning';
  return 'success';
}

function matchesLatencyFilter(latencyMs: number | null, filter: string): boolean {
  if (filter === 'ALL') return true;
  if (filter === 'NO_DATA') return latencyMs === null;
  if (latencyMs === null) return false;
  if (filter === 'FAST') return latencyMs < 500;
  if (filter === 'ELEVATED') return latencyMs >= 500 && latencyMs < 1_000;
  return latencyMs >= 1_000;
}

export function ServicesPage() {
  const { data, isLoading, isError, refetch } = useServices();
  const { employee } = useAuth();
  const queryClient = useQueryClient();
  const search = useServiceFiltersStore((state) => state.search);
  const status = useServiceFiltersStore((state) => state.status);
  const criticality = useServiceFiltersStore((state) => state.criticality);
  const latency = useServiceFiltersStore((state) => state.latency);
  const setSearch = useServiceFiltersStore((state) => state.setSearch);
  const setStatus = useServiceFiltersStore((state) => state.setStatus);
  const setCriticality = useServiceFiltersStore((state) => state.setCriticality);
  const setLatency = useServiceFiltersStore((state) => state.setLatency);
  const resetFilters = useServiceFiltersStore((state) => state.reset);
  const [showCreate, setShowCreate] = useState(false);
  const discovery = useQuery({
    queryKey: ['service-discovery'],
    queryFn: servicesService.discovery,
    staleTime: 15_000,
    retry: false,
  });
  const create = useMutation({
    mutationFn: (input: ServiceConfigInput) => servicesService.create(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["monitored-services"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard-overview"] });
      setShowCreate(false);
    },
  });
  const syncDiscovery = useMutation({
    mutationFn: servicesService.syncDiscovery,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['monitored-services'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard-overview'] });
      void queryClient.invalidateQueries({ queryKey: ['service-discovery'] });
    },
  });
  if (isLoading) return <TableSkeleton rows={5} label="Cargando servicios" />;
  if (isError)
    return (
      <ErrorState onRetry={() => void refetch()}>
        No se pudo cargar el catálogo.
      </ErrorState>
    );
  const services = data ?? [];
  const operationalCount = services.filter((service) => service.status === 'OPERATIONAL').length;
  const unavailableCount = services.filter((service) => service.status === 'UNAVAILABLE').length;
  const degradedCount = services.filter(
    (service) => service.status === 'DEGRADED' || service.status === 'RECOVERING',
  ).length;
  const needsAttentionCount = unavailableCount + degradedCount;
  const highCriticalityCount = services.filter(
    (service) => service.criticality === 'HIGH' || service.criticality === 'CRITICAL',
  ).length;
  const latencySamples = services
    .map((service) => service.latencyMs)
    .filter((latency): latency is number => latency !== null);
  const averageLatency = latencySamples.length
    ? Math.round(latencySamples.reduce((total, latency) => total + latency, 0) / latencySamples.length)
    : null;
  const statusDistribution = STATUS_ORDER.map((serviceStatus) => ({
    status: serviceStatus,
    count: services.filter((service) => service.status === serviceStatus).length,
  }));
  const discoveredPendingCount = discovery.data?.services.filter((service) => !service.registered).length ?? 0;
  const hasActiveFilters = search.length > 0 || status !== 'ALL' || criticality !== 'ALL' || latency !== 'ALL';
  const filtered = services.filter(
    (service) =>
      service.name.toLowerCase().includes(search.toLowerCase()) &&
      (status === "ALL" || service.status === status) &&
      (criticality === 'ALL' || service.criticality === criticality) &&
      matchesLatencyFilter(service.latencyMs, latency),
  );
  return (
    <section aria-label="Catálogo de servicios digitales">
      <Panel className="service-catalog-context" variant="flat">
        <div>
          <p className="service-catalog-context-eyebrow">Sincronización del catálogo</p>
          <p>Los servicios se detectan desde las rutas health declaradas por el backend bancario. Revisa su salud aquí; las rutas HTTP y su tráfico viven transversalmente en Operaciones API.</p>
          {discovery.data && (
            <small className="service-discovery-summary">
              {discoveredPendingCount
                ? `${discoveredPendingCount} servicio${discoveredPendingCount === 1 ? '' : 's'} detectado${discoveredPendingCount === 1 ? '' : 's'} pendiente${discoveredPendingCount === 1 ? '' : 's'} de incorporar.`
                : 'El catálogo está sincronizado con los health checks declarados.'}
            </small>
          )}
        </div>
        <div className="service-catalog-context-actions">
          {employee?.permissions.includes('services.manage') && (
            <ActionButton
              className="service-discovery-button"
              disabled={syncDiscovery.isPending}
              onClick={() => syncDiscovery.mutate()}
              size="sm"
              variant="outline"
            >
              <RefreshCw className={syncDiscovery.isPending ? 'is-spinning' : undefined} aria-hidden="true" />
              {syncDiscovery.isPending ? 'Sincronizando' : 'Sincronizar catálogo'}
            </ActionButton>
          )}
          {employee?.permissions.includes("analytics.read") && (
            <ActionButton asChild size="sm" variant="outline">
              <Link to={PATHS.ENDPOINTS}>Operaciones API <ArrowUpRight aria-hidden="true" /></Link>
            </ActionButton>
          )}
        </div>
      </Panel>
      <ServiceKpiGrid ariaLabel="Resumen operativo de servicios">
        <ServiceKpiCard
          label="Servicios supervisados"
          value={services.length}
          description={`${operationalCount} con estado operativo en la última comprobación.`}
          icon={ServerCog}
          tone={services.length ? 'info' : 'neutral'}
        />
        <ServiceKpiCard
          label="Requieren atención"
          value={needsAttentionCount}
          description={needsAttentionCount ? `${unavailableCount} no disponibles y ${degradedCount} degradados o recuperando.` : 'No se detectan servicios degradados ni no disponibles.'}
          icon={ShieldAlert}
          tone={needsAttentionCount ? 'critical' : 'success'}
        />
        <ServiceKpiCard
          label="Latencia promedio"
          value={averageLatency === null ? 'Sin datos' : `${averageLatency} ms`}
          description={latencySamples.length ? `Calculada con ${latencySamples.length} comprobaciones recientes.` : 'Aún no hay muestras de latencia disponibles.'}
          icon={Gauge}
          tone={getLatencyTone(averageLatency)}
        />
        <ServiceKpiCard
          label="Alta criticidad"
          value={highCriticalityCount}
          description="Servicios con prioridad alta o crítica para la operación bancaria."
          icon={Activity}
          tone={highCriticalityCount ? 'warning' : 'neutral'}
        />
      </ServiceKpiGrid>
      <Panel className="service-portfolio-panel" variant="flat" ariaLabelledBy="service-portfolio-title">
        <header className="service-portfolio-header">
          <div>
            <p className="service-catalog-context-eyebrow">Lectura del catálogo</p>
            <h2 id="service-portfolio-title">Distribución de salud</h2>
            <p>Una vista rápida del estado de los servicios antes de aplicar filtros o abrir el detalle.</p>
          </div>
          <span className="service-portfolio-total">{services.length} servicios</span>
        </header>
        <div className="service-portfolio-bars" aria-label="Distribución de estados">
          {statusDistribution.map(({ status: serviceStatus, count }) => (
            <div className={`service-portfolio-row is-${serviceStatus.toLowerCase()}`} key={serviceStatus}>
              <div>
                <span>{getServiceStatusLabel(serviceStatus)}</span>
                <strong>{count}</strong>
              </div>
              <div className="service-portfolio-track" aria-hidden="true">
                <i style={{ width: `${services.length ? (count / services.length) * 100 : 0}%` }} />
              </div>
            </div>
          ))}
        </div>
      </Panel>
      <div className="services-control-bar">
        <label className="service-field" htmlFor="service-search">
          <span>Buscar servicio</span>
          <Input
            id="service-search"
            className="service-search-input"
            variant="secondary"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Nombre del servicio"
          />
        </label>
        <Select
          className="service-field service-heroui-select"
          placeholder="Todos"
          selectedKey={status}
          onSelectionChange={(key) => key != null && setStatus(String(key))}
        >
          <Label>Estado</Label>
          <Select.Trigger className="service-select-trigger">
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover className="service-select-popover">
            <ListBox className="service-select-listbox">
              {SERVICE_STATUS_FILTER_OPTIONS.map((option) => (
                <ListBox.Item className="service-select-option" key={option.value} id={option.value} textValue={option.label}><Label>{option.label}</Label><ListBox.ItemIndicator /></ListBox.Item>
              ))}
            </ListBox>
          </Select.Popover>
        </Select>
        <Select
          className="service-field service-heroui-select"
          placeholder="Todas"
          selectedKey={criticality}
          onSelectionChange={(key) => key != null && setCriticality(String(key))}
        >
          <Label>Criticidad</Label>
          <Select.Trigger className="service-select-trigger">
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover className="service-select-popover">
            <ListBox className="service-select-listbox">
              {CRITICALITY_FILTER_OPTIONS.map((option) => (
                <ListBox.Item className="service-select-option" key={option.value} id={option.value} textValue={option.label}><Label>{option.label}</Label><ListBox.ItemIndicator /></ListBox.Item>
              ))}
            </ListBox>
          </Select.Popover>
        </Select>
        <Select
          className="service-field service-heroui-select"
          placeholder="Todas"
          selectedKey={latency}
          onSelectionChange={(key) => key != null && setLatency(String(key))}
        >
          <Label>Latencia</Label>
          <Select.Trigger className="service-select-trigger">
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover className="service-select-popover">
            <ListBox className="service-select-listbox">
              {LATENCY_FILTER_OPTIONS.map((option) => (
                <ListBox.Item className="service-select-option" key={option.value} id={option.value} textValue={option.label}><Label>{option.label}</Label><ListBox.ItemIndicator /></ListBox.Item>
              ))}
            </ListBox>
          </Select.Popover>
        </Select>
        <div className="service-filter-actions" aria-label="Acciones de filtro">
          {hasActiveFilters && (
            <ActionButton onClick={resetFilters} size="sm" variant="ghost">
              <X aria-hidden="true" />
              Limpiar
            </ActionButton>
          )}
        </div>
        {employee?.permissions.includes("services.manage") && (
          <Modal isOpen={showCreate} onOpenChange={setShowCreate}>
            <Button
              aria-label="Registrar manualmente un servicio no detectado"
              className="service-register-button"
              variant="primary"
              size="sm"
            >
              <Plus aria-hidden="true" />
              Registrar manualmente
            </Button>
            <Modal.Backdrop className="service-modal-backdrop" isDismissable={!create.isPending}>
              <Modal.Container className="service-modal-container" placement="center" size="lg">
                <Modal.Dialog className="service-modal-dialog">
                  <Modal.CloseTrigger aria-label="Cerrar registro de servicio" isDisabled={create.isPending} />
                  <Modal.Header className="service-modal-header">
                    <Modal.Heading>Nuevo servicio supervisado</Modal.Heading>
                    <p>Úsalo para incorporar una capacidad que aún no esté en el catálogo o que requiera una comprobación específica.</p>
                  </Modal.Header>
                  <Modal.Body className="service-modal-body">
                    <CreateServiceForm
                      isPending={create.isPending}
                      isError={create.isError}
                      onSubmit={(input) => create.mutate(input)}
                    />
                  </Modal.Body>
                </Modal.Dialog>
              </Modal.Container>
            </Modal.Backdrop>
          </Modal>
        )}
      </div>
      {filtered.length ? (
        <ServiceTable services={filtered} />
      ) : (
        <EmptyState>No hay servicios para los filtros seleccionados.</EmptyState>
      )}
      <footer className="services-pagination" aria-live="polite">
        <span>{filtered.length} de {data?.length ?? 0}</span>
      </footer>
    </section>
  );
}
