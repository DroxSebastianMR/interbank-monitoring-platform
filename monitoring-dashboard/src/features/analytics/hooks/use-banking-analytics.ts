import { useQuery } from '@tanstack/react-query';
import { bankingAnalyticsService } from '@/features/analytics/services/banking-analytics.service';
export function useBankingAnalytics(employeeId: string | undefined, enabled: boolean) {
  return useQuery({ queryKey: ['banking-analytics', employeeId], queryFn: bankingAnalyticsService.snapshot, enabled, staleTime: 30000, refetchInterval: 60000, retry: false });
}
