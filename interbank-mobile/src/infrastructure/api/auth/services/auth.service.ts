import { apiClient } from "@/src/infrastructure/api/client/axios.instance";
import { API_ENDPOINTS } from "@/src/infrastructure/api/endpoints";
import type {
  AuthApiResponse,
  DeviceLoginRequest,
  FirstLoginRequest,
} from "@/src/infrastructure/api/auth/services/auth.types";

export const authService = {
  async firstLogin(request: FirstLoginRequest): Promise<AuthApiResponse> {
    const { data } = await apiClient.post<AuthApiResponse>(
      API_ENDPOINTS.AUTH.LOGIN,
      request,
    );
    return data;
  },

  async deviceLogin(request: DeviceLoginRequest): Promise<AuthApiResponse> {
    const { data } = await apiClient.post<AuthApiResponse>(
      API_ENDPOINTS.AUTH.DEVICE_LOGIN,
      request,
    );
    return data;
  },
};
