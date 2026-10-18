import { useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { RefreshCw, Route, Server } from "lucide-react";
import { useAuth } from "@/app/providers/auth/use-auth";
import { PATHS } from "@/app/router/constants/paths";
import { Button } from "@/components/ui/button";
import { PermissionCode } from "@/features/auth/enums/permission-code.enum";
import { EndpointFilters } from "@/features/endpoints/components/endpoint-filters";
import { EndpointTable } from "@/features/endpoints/components/endpoint-table";
import { TelemetryBadge } from "@/features/endpoints/components/telemetry-badge";
import { TelemetryState } from "@/features/endpoints/enums/endpoint-state.enum";
import { useEndpoints } from "@/features/endpoints/hooks/use-endpoints";
import type { EndpointFilters as Filters } from "@/features/endpoints/types/endpoint.types";
import {
  ALL_ENDPOINTS,
  ENDPOINT_PAGE_SIZE,
  filterEndpoints,
} from "@/features/endpoints/utils/endpoint-metrics";
import { ErrorState } from "@/shared/components/error-state";
import { PanelSkeleton } from "@/shared/components/loading/module-skeleton";

export function EndpointsPage() {
  const { employee } = useAuth();
  const canRead =
    employee?.permissions.includes(PermissionCode.ANALYTICS_READ) ?? false;
  const query = useEndpoints(employee?.id, canRead);
  const [filters, setFilters] = useState<Filters>({
    instance: ALL_ENDPOINTS,
    module: ALL_ENDPOINTS,
    method: ALL_ENDPOINTS,
    search: "",
  });
  const [page, setPage] = useState(1);
  const endpoints = query.data?.endpoints;
  const filtered = useMemo(
    () => filterEndpoints(endpoints ?? [], filters),
    [endpoints, filters],
  );
  const modules = useMemo(
    () => [...new Set(endpoints?.map((endpoint) => endpoint.module))].sort(),
    [endpoints],
  );
  const methods = useMemo(
    () => [...new Set(endpoints?.map((endpoint) => endpoint.method))].sort(),
    [endpoints],
  );
  const pages = Math.max(1, Math.ceil(filtered.length / ENDPOINT_PAGE_SIZE));
  const currentPage = Math.min(page, pages);

  if (!canRead) return <Navigate to={PATHS.FORBIDDEN} replace />;
  if (query.isPending)
    return (
      <PanelSkeleton rows={5} label="Descubriendo operaciones de la API" />
    );
  if (query.isError || !query.data)
    return (
      <ErrorState onRetry={() => void query.refetch()}>
        No se pudo consultar el catálogo. Esto no confirma una caída de la API
        bancaria.
      </ErrorState>
    );
  const snapshot = query.data;
  const expired = Date.now() - Date.parse(snapshot.generatedAt) > 35_000;
  return (
    <section className="space-y-5 text-slate-900">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-widest text-emerald-700">
            OBSERVABILIDAD DE LA API
          </p>
          <h2 className="mt-1 text-2xl font-semibold">
            Endpoints por instancia
          </h2>
          <p className="mt-2 max-w-3xl text-sm text-slate-500">
            Inventario automático por módulo y método. Compara las réplicas sin
            ejecutar operaciones ni registrar rutas manualmente.
          </p>
        </div>
        <Button
          variant="outline"
          disabled={query.isFetching}
          onClick={() => void query.refetch()}
        >
          <RefreshCw
            className={query.isFetching ? "animate-spin" : ""}
            aria-hidden="true"
          />
          Actualizar
        </Button>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5">
          <Route className="mb-3 size-5 text-emerald-700" aria-hidden="true" />
          <p className="text-3xl font-semibold">
            {
              new Set(
                endpoints?.map(
                  (endpoint) => `${endpoint.method} ${endpoint.route}`,
                ),
              ).size
            }
          </p>
          <p className="text-sm text-slate-600">
            Operaciones únicas · {modules.length} módulos
          </p>
        </div>
        {snapshot.instances.map((instance) => (
          <div
            key={instance.id}
            className="rounded-2xl border border-slate-200 bg-white p-5"
          >
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <Server className="size-5 text-blue-700" aria-hidden="true" />
              <TelemetryBadge
                state={expired ? TelemetryState.STALE : instance.state}
              />
            </div>
            <p className="font-semibold">{instance.id}</p>
            <p className="mt-1 text-sm text-slate-500">
              {instance.endpointCount} operaciones declaradas
            </p>
            {instance.endpointCount === 0 && (
              <p className="mt-2 text-xs text-amber-800">
                Inventario pendiente: verifica la instrumentación de esta réplica.
              </p>
            )}
            <p className="mt-2 text-xs text-slate-500">
              Último scrape:{" "}
              {instance.observedAt
                ? new Date(instance.observedAt).toLocaleTimeString("es-PE")
                : "sin datos"}
            </p>
          </div>
        ))}
      </div>
      {(snapshot.sourceState !== TelemetryState.AVAILABLE || expired) && (
        <p
          role="status"
          className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
        >
          No hay telemetría reciente del colector. El último catálogo puede
          seguir visible, pero sus métricas no representan el estado actual.
        </p>
      )}
      {!endpoints?.length && (
        <p className="rounded-xl bg-blue-50 p-4 text-sm text-blue-900">
          Aún no hay inventario. Las instancias necesitan la nueva
          instrumentación y Prometheus debe completar un scrape. No significa
          que no existan endpoints.
        </p>
      )}
      <EndpointFilters
        value={filters}
        instances={snapshot.instances.map((instance) => instance.id)}
        modules={modules}
        methods={methods}
        onChange={(value) => {
          setFilters(value);
          setPage(1);
        }}
      />
      <div className="flex flex-wrap justify-between gap-2 text-xs text-slate-500">
        <span>
          {filtered.length} operaciones por instancia · ventana de{" "}
          {snapshot.windowSeconds / 60} min
        </span>
        <span>Consulta cada 10 s · API con caché de 5 s · P95 aproximado</span>
      </div>
      {expired ? (
        <p role="status" className="p-6 text-center text-slate-500">
          Actualiza la consulta para volver a ver las métricas.
        </p>
      ) : (
        <EndpointTable
          endpoints={filtered.slice(
            (currentPage - 1) * ENDPOINT_PAGE_SIZE,
            currentPage * ENDPOINT_PAGE_SIZE,
          )}
        />
      )}
      <div className="flex items-center justify-end gap-3">
        <Button
          variant="outline"
          disabled={currentPage === 1}
          onClick={() => setPage(currentPage - 1)}
        >
          Anterior
        </Button>
        <span className="text-sm text-slate-600">
          {currentPage} / {pages}
        </span>
        <Button
          variant="outline"
          disabled={currentPage === pages}
          onClick={() => setPage(currentPage + 1)}
        >
          Siguiente
        </Button>
      </div>
      <p className="text-xs leading-relaxed text-slate-500">
        Un scrape activo solo confirma la lectura de métricas, no que cada
        operación funcione. Sin tráfico no equivale a disponibilidad. Las
        respuestas 4xx se muestran separadas de los errores 5xx. La latencia no
        incluye el viaje desde el navegador. El catálogo conserva las rutas de
        instancias sin respuesta durante hasta una hora.
      </p>
    </section>
  );
}
