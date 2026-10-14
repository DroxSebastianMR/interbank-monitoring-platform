import axios, { type InternalAxiosRequestConfig } from 'axios';

import { authStorage } from '@/features/auth/utils/auth.storage';
import type { AuthResponse } from '@/features/auth/types/auth.types';
import { apiClient } from '@/infrastructure/api/client/axios.instance';
import { API_ENDPOINTS } from '@/infrastructure/api/endpoints';

type RetryableConfig = InternalAxiosRequestConfig & { _retried?: boolean };
let installed = false;
let refreshPending: Promise<string> | null = null;

export class ApiError extends Error {
  constructor(public readonly status: number, message: string) { super(message); }
}

function expireSession(): void {
  authStorage.clear();
  window.dispatchEvent(new Event('monitoring-auth-expired'));
}

export function setupInterceptors(): void {
  if (installed) return;
  installed = true;
  apiClient.interceptors.request.use((config) => {
    const token = authStorage.getSession()?.tokens.accessToken;
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });
  apiClient.interceptors.response.use((response) => response, async (cause: unknown) => {
    if (!axios.isAxiosError(cause)) return Promise.reject(cause);
    const request = cause.config as RetryableConfig | undefined;
    const status = cause.response?.status ?? 0;
    const cannotRefresh = request?.url === API_ENDPOINTS.AUTH.LOGIN ||
      request?.url === API_ENDPOINTS.AUTH.REFRESH ||
      request?.url === API_ENDPOINTS.AUTH.LOGOUT;
    if (status === 401 && request && !request._retried && !cannotRefresh) {
      const session = authStorage.getSession();
      if (session) {
        request._retried = true;
        refreshPending ??= apiClient.post<AuthResponse>(API_ENDPOINTS.AUTH.REFRESH, {
          refreshToken: session.tokens.refreshToken,
        }).then(({ data }) => {
          authStorage.set(data);
          return data.tokens.accessToken;
        }).finally(() => { refreshPending = null; });
        try {
          request.headers.Authorization = `Bearer ${await refreshPending}`;
          return await apiClient(request);
        } catch {
          expireSession();
        }
      } else {
        expireSession();
      }
    }
    const body = cause.response?.data as { message?: string | string[] } | undefined;
    const message = Array.isArray(body?.message) ? body.message.join(', ') : body?.message;
    return Promise.reject(new ApiError(status, message ?? (status === 0 ? 'No se pudo conectar con el monitor' : 'No se pudo completar la solicitud')));
  });
}
