import { APP_CONFIG } from "@/src/config/app.config";
import { authStorage } from "@/src/modules/auth/storage/auth.storage";
import { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from "axios";

export const setupInterceptors = (client: AxiosInstance) => {
  client.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
      try {
        const token = await authStorage.getAccessToken();

        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        config.headers["x-platform"] = APP_CONFIG.PLATFORM;
        config.headers["x-app-version"] = APP_CONFIG.VERSION;

        return config;
      } catch (error) {
        return Promise.reject(error);
      }
    },
  );

  client.interceptors.response.use(
    (response) => response,

    async (error: AxiosError) => {
      if (!error.response) {
        return Promise.reject({ type: "NETWORK_ERROR", error });
      }

      const status = error.response.status;

      switch (status) {
        case 401:
          return Promise.reject({ type: "UNAUTHORIZED", error });

        case 403:
          return Promise.reject({ type: "FORBIDDEN", error });

        case 503:
          return Promise.reject({ type: "MAINTENANCE", error });

        default:
          return Promise.reject({
            type: "API_ERROR",
            status,
            error,
          });
      }
    },
  );
};
