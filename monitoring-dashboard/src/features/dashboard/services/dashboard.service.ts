import { apiClient } from "@/infrastructure/api/client/axios.instance";
import { API_ENDPOINTS } from "@/infrastructure/api/endpoints";
import {
  overviewContract,
  metricsContract,
  topologyContract,
  parseMonitoringContract,
} from "@/features/dashboard/types/dashboard-contracts";
import type {
  ActivityItem,
  DashboardOverview,
  DashboardTopology,
  MetricSeries,
} from "@/features/dashboard/types/dashboard.types";

export const dashboardService = {
  overview: async (signal?: AbortSignal): Promise<DashboardOverview> =>
    parseMonitoringContract(
      overviewContract,
      (
        await apiClient.get<unknown>(API_ENDPOINTS.DASHBOARD.OVERVIEW, {
          signal,
        })
      ).data,
    ),
  metrics: async (
    metric: "latency" | "availability",
    filters?: { from: string; to: string; serviceId?: string },
    signal?: AbortSignal,
  ): Promise<MetricSeries> =>
    parseMonitoringContract(
      metricsContract,
      (
        await apiClient.get<unknown>(API_ENDPOINTS.DASHBOARD.METRICS, {
          params: { metric, ...filters },
          signal,
        })
      ).data,
    ),
  activity: async (signal?: AbortSignal): Promise<ActivityItem[]> =>
    (
      await apiClient.get<ActivityItem[]>(API_ENDPOINTS.DASHBOARD.ACTIVITY, {
        signal,
      })
    ).data,
  topology: async (signal?: AbortSignal): Promise<DashboardTopology> =>
    parseMonitoringContract(
      topologyContract,
      (
        await apiClient.get<unknown>(API_ENDPOINTS.DASHBOARD.TOPOLOGY, {
          signal,
        })
      ).data,
    ),
};
