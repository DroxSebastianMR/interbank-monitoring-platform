import { apiClient } from "@/src/infrastructure/api/client/axios.instance";
import { API_ENDPOINTS } from "@/src/infrastructure/api/endpoints";
import type { HomeResponse } from "@/src/infrastructure/api/home/services/home.types";

export const homeService = {
  async getSummary(): Promise<HomeResponse> {
    const { data } = await apiClient.get<HomeResponse>(
      API_ENDPOINTS.HOME.SUMMARY,
    );
    return data;
  },
};
