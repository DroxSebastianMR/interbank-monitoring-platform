import { useEffect, useRef } from 'react';
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { incidentWorkflowService } from '@/features/incidents/services/incident-workflow.service';

export function useIncidentDetail(id: string, employeeId: string | undefined, allowed: boolean) {
  const client = useQueryClient();
  const previous = useRef<{ scope: string; version: number } | null>(null);
  const detail = useQuery({ queryKey: ['incident-detail', employeeId, id],
    queryFn: () => incidentWorkflowService.detail(id), enabled: allowed && !!id,
    refetchInterval: 10_000, retry: false });
  const timeline = useInfiniteQuery({ queryKey: ['incident-events', employeeId, id],
    queryFn: ({ pageParam }) => incidentWorkflowService.timeline(id, pageParam),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (last) => last.nextBeforeVersion ?? undefined,
    enabled: allowed && !!id, retry: false });
  const version = detail.data?.version;
  useEffect(() => {
    if (version === undefined || !allowed) return;
    const scope = `${employeeId}:${id}`;
    if (previous.current?.scope === scope && previous.current.version !== version) {
      void client.invalidateQueries({ queryKey: ['incident-events', employeeId, id] });
    }
    previous.current = { scope, version };
  }, [version, employeeId, id, client, allowed]);
  return { detail, timeline };
}
