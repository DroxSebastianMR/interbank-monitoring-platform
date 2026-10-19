import { apiGet } from '@/infrastructure/api/client/axios.instance';
import { API_ENDPOINTS } from '@/infrastructure/api/endpoints';

export const healthService = {
  check: (): Promise<unknown> => apiGet(API_ENDPOINTS.HEALTH),
};
