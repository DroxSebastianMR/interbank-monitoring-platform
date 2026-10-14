import { apiGet, apiPost } from '@/infrastructure/api/client/axios.instance';
import { API_ENDPOINTS } from '@/infrastructure/api/endpoints';
import { authStorage } from '@/features/auth/utils/auth.storage';
import type { AuthResponse, Employee } from '@/features/auth/types/auth.types';

export const authService = {
  async login(corporateEmail: string, password: string): Promise<AuthResponse> {
    const session = await apiPost<AuthResponse>(API_ENDPOINTS.AUTH.LOGIN, { corporateEmail, password });
    authStorage.set(session);
    return session;
  },
  me(): Promise<Employee> {
    return apiGet<Employee>(API_ENDPOINTS.AUTH.ME);
  },
  async logout(): Promise<void> {
    try {
      if (authStorage.getSession()) await apiPost(API_ENDPOINTS.AUTH.LOGOUT);
    } finally {
      authStorage.clear();
    }
  },
};
