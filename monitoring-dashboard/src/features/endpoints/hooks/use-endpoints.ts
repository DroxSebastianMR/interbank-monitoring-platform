import { useQuery } from "@tanstack/react-query";
import { endpointsService } from "@/features/endpoints/services/endpoints.service";

export function useEndpoints(employeeId: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: ["endpoint-observability", employeeId],
    queryFn: endpointsService.snapshot,
    enabled,
    staleTime: 5_000,
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
    retry: false,
  });
}
