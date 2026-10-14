import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from '@/app/providers/auth/use-auth';
import { ServiceTable } from '@/features/services/components/service-table';
import { CreateServiceForm } from '@/features/services/forms/create-service-form';
import { useServices } from '@/features/services/hooks/use-services';
import { servicesService } from '@/features/services/services/services.service';
import type { ServiceConfigInput } from '@/features/services/types/service.types';
import { useServiceFiltersStore } from '@/features/services/store/service-filters.store';

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
  if (isLoading) return <div className="notice">Cargando servicios…</div>;
  if (isError)
    return (
      <div role="alert" className="notice error">
        No se pudo cargar el catálogo.{" "}
        <button onClick={() => void refetch()}>Reintentar</button>
      </div>
    );
  const filtered = (data ?? []).filter(
    (service) =>
      service.name.toLowerCase().includes(search.toLowerCase()) &&
      (status === "ALL" || service.status === status),
  );
  return (
    <section>
      <div className="section-title">
        <h2>Servicios digitales</h2>
        <div>
          <span>
            {filtered.length} de {data?.length ?? 0}
          </span>{" "}
          {employee?.permissions.includes("services.manage") && (
            <button onClick={() => setShowCreate(!showCreate)}>
              {showCreate ? "Cancelar" : "Registrar servicio"}
            </button>
          )}
        </div>
      </div>
      {showCreate && <CreateServiceForm isPending={create.isPending} isError={create.isError}
        onSubmit={(input) => create.mutate(input)} />}
      <div className="service-filters">
        <label>
          Buscar servicio
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Nombre del servicio"
          />
        </label>
        <label>
          Estado
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="ALL">Todos</option>
            <option value="OPERATIONAL">Operativo</option>
            <option value="DEGRADED">Degradado</option>
            <option value="UNAVAILABLE">No disponible</option>
            <option value="RECOVERING">Recuperando</option>
          </select>
        </label>
      </div>
      {filtered.length ? (
        <ServiceTable services={filtered} />
      ) : (
        <div className="notice">
          No hay servicios para los filtros seleccionados.
        </div>
      )}
    </section>
  );
}
