import { apiGet } from "@/infrastructure/api/client/axios.instance";
import { API_ENDPOINTS } from "@/infrastructure/api/endpoints";
import type { EndpointSnapshot } from "@/features/endpoints/types/endpoint.types";

export const endpointsService = {
  snapshot: () => apiGet<EndpointSnapshot>(API_ENDPOINTS.ENDPOINTS),
};
