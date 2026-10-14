import { useQuery } from '@tanstack/react-query';
import { servicesService } from '@/features/services/services/services.service';

export function useServices() {
  return useQuery({ queryKey: ['monitored-services'], queryFn: servicesService.list, refetchInterval: 10_000 });
}
