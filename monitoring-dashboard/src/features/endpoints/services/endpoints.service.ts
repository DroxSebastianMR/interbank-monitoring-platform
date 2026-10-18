import { apiGet } from "@/infrastructure/api/client/axios.instance";
import { API_ENDPOINTS } from "@/infrastructure/api/endpoints";
import { liveSnapshotSchema } from '@/features/realtime/types/operational-event.schema';
import type { EndpointSnapshot } from '@/features/endpoints/types/endpoint.types';

export const endpointsService = {
  snapshot: async (): Promise<EndpointSnapshot> => liveSnapshotSchema.parse(await apiGet<unknown>(`${API_ENDPOINTS.ENDPOINTS}/snapshot`)),
};
