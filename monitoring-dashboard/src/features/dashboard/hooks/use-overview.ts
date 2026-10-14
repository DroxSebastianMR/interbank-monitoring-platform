import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '@/features/dashboard/services/dashboard.service';

export function useOverview() {
  return useQuery({ queryKey: ['dashboard-overview'], queryFn: dashboardService.overview, refetchInterval: 10_000 });
}
