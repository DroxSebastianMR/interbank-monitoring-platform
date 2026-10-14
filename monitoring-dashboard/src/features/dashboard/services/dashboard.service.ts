import { apiGet, apiClient } from '@/infrastructure/api/client/axios.instance';
import { API_ENDPOINTS } from '@/infrastructure/api/endpoints';
import type { ActivityItem, DashboardOverview, DashboardTopology, MetricSeries } from '@/features/dashboard/types/dashboard.types';

export const dashboardService = {
  overview: (): Promise<DashboardOverview> => apiGet(API_ENDPOINTS.DASHBOARD.OVERVIEW),
  metrics: async (metric: 'latency' | 'availability'): Promise<MetricSeries> =>
    (await apiClient.get<MetricSeries>(API_ENDPOINTS.DASHBOARD.METRICS, { params: { metric } })).data,
  activity: (): Promise<ActivityItem[]> => apiGet(API_ENDPOINTS.DASHBOARD.ACTIVITY),
  topology: (): Promise<DashboardTopology> => apiGet(API_ENDPOINTS.DASHBOARD.TOPOLOGY),
};
