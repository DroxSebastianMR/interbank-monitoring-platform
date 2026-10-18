import { apiClient } from "@/src/infrastructure/api/client/axios.instance";
import { API_ENDPOINTS } from "@/src/infrastructure/api/endpoints";
import type { HealthResponse } from "@/src/infrastructure/api/system/system.types";

export const systemService = {
  async health(): Promise<HealthResponse> {
    const { data } = await apiClient.get<HealthResponse>(
      API_ENDPOINTS.SYSTEM.HEALTH,
    );
    return data;
  },
};
