import { useQuery } from '@tanstack/react-query';
import { incidentsService } from '@/features/incidents/services/incidents.service';

export function useOperationalHistory(employeeId: string | undefined, kind: 'incidents' | 'alerts', enabled: boolean) {
  return useQuery({ queryKey: [kind, employeeId], queryFn: async () => {
    if (kind === 'incidents') return (await incidentsService.list()).map((item) => ({ id: item.id, title: item.title, category: item.serviceKey, status: item.status, severity: item.severity, date: item.openedAt, resolvedAt: item.resolvedAt, reference: item.id }));
    return (await incidentsService.alerts()).map((item) => ({ id: item.id, title: item.message, category: item.kind, status: item.kind, severity: '', date: item.createdAt, resolvedAt: null, reference: item.incidentId }));
  }, enabled, staleTime: 5000, refetchInterval: 30000, retry: false });
}
