import { useQuery } from "@tanstack/react-query";
import { dashboardService } from "@/features/dashboard/services/dashboard.service";
import { OVERVIEW_POLL_INTERVAL_MS } from "@/features/dashboard/types/overview-filters.types";
import {
  monitoringPoll,
  retryMonitoringQuery,
} from "@/features/dashboard/utils/dashboard-data-state";

export function useOverview(cacheScope?: string, enabled = true) {
  return useQuery({
    queryKey: ["dashboard-overview", cacheScope],
    queryFn: ({ signal }) => dashboardService.overview(signal),
    enabled,
    refetchInterval: (query) => monitoringPoll(query.state.error),
    staleTime: OVERVIEW_POLL_INTERVAL_MS / 2,
    retry: retryMonitoringQuery,
  });
}
