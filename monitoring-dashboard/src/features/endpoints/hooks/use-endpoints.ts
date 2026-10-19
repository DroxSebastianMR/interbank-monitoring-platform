import { useQuery } from "@tanstack/react-query";
import { endpointsService } from "@/features/endpoints/services/endpoints.service";

export function useEndpoints(employeeId: string | undefined, enabled: boolean, refetchInterval = 30_000) {
  return useQuery({
    queryKey: ["endpoint-observability", employeeId],
    queryFn: endpointsService.snapshot,
    enabled,
    staleTime: 5_000,
    refetchInterval,
    refetchIntervalInBackground: false,
    retry: false,
  });
}
