import { axiosConfig } from "@/src/infrastructure/api/client/axios.config";
import { setupInterceptors } from "@/src/infrastructure/api/client/axios.interceptors";
import { create } from "axios";

export const apiClient = create(axiosConfig);
setupInterceptors(apiClient);
