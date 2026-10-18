import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from '@/app/providers/auth/use-auth';
import { ServiceTable } from '@/features/services/components/service-table';
import { CreateServiceForm } from '@/features/services/forms/create-service-form';
import { useServices } from '@/features/services/hooks/use-services';
import { servicesService } from '@/features/services/services/services.service';
import type { ServiceConfigInput } from '@/features/services/types/service.types';
import { useServiceFiltersStore } from '@/features/services/store/service-filters.store';
import { SERVICE_STATUS_FILTER_OPTIONS } from '@/features/services/constants/service.constants';
import { Input } from '@/components/ui/heroui-input';
import { Button } from '@/components/ui/heroui-button';
import { Modal } from '@/components/ui/heroui-modal';
import { Label, ListBox, Select } from '@/components/ui/heroui-select';
import { Plus } from 'lucide-react';
import { TableSkeleton } from '@/shared/components/loading/module-skeleton';
import { EmptyState } from '@/shared/components/empty-state';
import { ErrorState } from '@/shared/components/error-state';

export function ServicesPage() {
  const { data, isLoading, isError, refetch } = useServices();
  const { employee } = useAuth();
  const queryClient = useQueryClient();
  const search = useServiceFiltersStore((state) => state.search);
  const status = useServiceFiltersStore((state) => state.status);
  const setSearch = useServiceFiltersStore((state) => state.setSearch);
  const setStatus = useServiceFiltersStore((state) => state.setStatus);
  const [showCreate, setShowCreate] = useState(false);
  const create = useMutation({
    mutationFn: (input: ServiceConfigInput) => servicesService.create(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["monitored-services"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard-overview"] });
      setShowCreate(false);
    },
  });
  if (isLoading) return <TableSkeleton rows={5} label="Cargando servicios" />;
  if (isError)
    return (
      <ErrorState onRetry={() => void refetch()}>
        No se pudo cargar el catálogo.
      </ErrorState>
    );
  const filtered = (data ?? []).filter(
    (service) =>
      service.name.toLowerCase().includes(search.toLowerCase()) &&
      (status === "ALL" || service.status === status),
  );
  return (
    <section aria-label="Catálogo de servicios digitales">
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
          <Select.Popover>
            <ListBox>
              {SERVICE_STATUS_FILTER_OPTIONS.map((option) => (
                <ListBox.Item key={option.value} id={option.value} textValue={option.label}><Label>{option.label}</Label><ListBox.ItemIndicator /></ListBox.Item>
              ))}
            </ListBox>
          </Select.Popover>
        </Select>
        {employee?.permissions.includes("services.manage") && (
          <Modal isOpen={showCreate} onOpenChange={setShowCreate}>
            <Button className="service-register-button" variant="primary" size="lg">
              <Plus aria-hidden="true" />
              Registrar servicio
            </Button>
            <Modal.Backdrop className="service-modal-backdrop" isDismissable={!create.isPending}>
              <Modal.Container className="service-modal-container" placement="center" size="lg">
                <Modal.Dialog className="service-modal-dialog">
                  <Modal.CloseTrigger aria-label="Cerrar registro de servicio" isDisabled={create.isPending} />
                  <Modal.Header className="service-modal-header">
                    <Modal.Heading>Nuevo servicio supervisado</Modal.Heading>
                    <p>Registra una ruta de salud relativa del backend bancario configurado.</p>
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
