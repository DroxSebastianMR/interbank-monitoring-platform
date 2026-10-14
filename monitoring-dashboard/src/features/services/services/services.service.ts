import { apiClient, apiGet, apiPatch, apiPost } from '@/infrastructure/api/client/axios.instance';
import { API_ENDPOINTS } from '@/infrastructure/api/endpoints';
import type {
  MonitoredService, ServiceCheck, ServiceConfigChange, ServiceConfigInput,
  ServiceInstances, ServiceStateChange,
} from '@/features/services/types/service.types';

export const servicesService = {
  list: (): Promise<MonitoredService[]> => apiGet(API_ENDPOINTS.SERVICES.LIST),
  detail: (id: string): Promise<MonitoredService> => apiGet(API_ENDPOINTS.SERVICES.DETAIL(id)),
  checks: (id: string): Promise<ServiceCheck[]> => apiGet(API_ENDPOINTS.SERVICES.CHECKS(id)),
  stateHistory: (id: string): Promise<ServiceStateChange[]> => apiGet(API_ENDPOINTS.SERVICES.STATE_HISTORY(id)),
  configHistory: (id: string): Promise<ServiceConfigChange[]> => apiGet(API_ENDPOINTS.SERVICES.CONFIG_HISTORY(id)),
  instances: (id: string): Promise<ServiceInstances> => apiGet(API_ENDPOINTS.SERVICES.INSTANCES(id)),
  create: (input: ServiceConfigInput): Promise<MonitoredService> => apiPost(API_ENDPOINTS.SERVICES.LIST, input),
  update: (id: string, input: { name: string; endpoint: string; criticality: string; expectedVersion: number; reason: string }): Promise<MonitoredService> => apiPatch(API_ENDPOINTS.SERVICES.DETAIL(id), input),
  pause: (id: string, reason: string): Promise<MonitoredService> => apiPost(API_ENDPOINTS.SERVICES.PAUSE(id), { reason }),
  resume: (id: string): Promise<MonitoredService> => apiPost(API_ENDPOINTS.SERVICES.RESUME(id)),
  check: async (id: string): Promise<MonitoredService> => (await apiClient.post<MonitoredService>(API_ENDPOINTS.SERVICES.CHECK(id))).data,
};
