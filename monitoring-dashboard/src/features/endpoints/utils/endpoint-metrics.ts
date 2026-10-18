import { TelemetryState } from "@/features/endpoints/enums/endpoint-state.enum";
import type {
  EndpointFilters,
  EndpointMetric,
} from "@/features/endpoints/types/endpoint.types";

export const ALL_ENDPOINTS = "__all__";
export const ENDPOINT_PAGE_SIZE = 25;

export function filterEndpoints(
  endpoints: EndpointMetric[],
  filters: EndpointFilters,
): EndpointMetric[] {
  const search = filters.search.trim().toLocaleLowerCase();
  return endpoints.filter(
    (endpoint) =>
      (filters.instance === ALL_ENDPOINTS ||
        endpoint.instance === filters.instance) &&
      (filters.module === ALL_ENDPOINTS ||
        endpoint.module === filters.module) &&
      (filters.method === ALL_ENDPOINTS ||
        endpoint.method === filters.method) &&
      (!search ||
        `${endpoint.method} ${endpoint.route} ${endpoint.module}`
          .toLocaleLowerCase()
          .includes(search)),
  );
}

export function errorPercent(endpoint: EndpointMetric): number | null {
  if (
    endpoint.state !== TelemetryState.AVAILABLE ||
    !endpoint.requestRateHz ||
    endpoint.serverErrorRateHz === null
  )
    return null;
  return Math.min(
    100,
    (endpoint.serverErrorRateHz / endpoint.requestRateHz) * 100,
  );
}

export function metricNumber(value: number | null, digits = 2): string {
  return value === null || !Number.isFinite(value)
    ? "—"
    : value.toLocaleString("es-PE", { maximumFractionDigits: digits });
}
