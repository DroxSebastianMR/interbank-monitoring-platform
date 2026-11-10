import { useEffect, useSyncExternalStore } from 'react';
import { onlineManager, useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationsService } from '@/features/notifications/services/notifications.service';
import { notificationAccessBlocked, notificationError } from '@/features/notifications/utils/notification-error';

const notificationKeys = {
  scope: (employeeId: string) => ['notifications', employeeId] as const,
  count: (employeeId: string) => ['notifications', employeeId, 'unread-count'] as const,
  inbox: (employeeId: string) => ['notifications', employeeId, 'inbox'] as const,
};
const subscribeOnline = (onChange: () => void) => onlineManager.subscribe(onChange);

export function useNotifications(employeeId: string, open: boolean) {
  const client = useQueryClient();
  const online = useSyncExternalStore(subscribeOnline, () => onlineManager.isOnline(), () => true);
  const count = useQuery({
    queryKey: notificationKeys.count(employeeId),
    queryFn: ({ signal }) => notificationsService.unreadCount(signal),
    staleTime: 5_000, retry: false,
    refetchInterval: (query) => notificationAccessBlocked(query.state.error) ? false : 10_000,
    refetchOnWindowFocus: (query) => !notificationAccessBlocked(query.state.error),
  });
  const inbox = useInfiniteQuery({
    queryKey: notificationKeys.inbox(employeeId), initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam, signal }) => notificationsService.inbox(pageParam, signal),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    maxPages: 5, staleTime: 5_000, retry: false,
    enabled: open && count.data !== undefined && !notificationAccessBlocked(count.error),
    refetchInterval: (query) => notificationAccessBlocked(query.state.error) || notificationError(query.state.error) === 'invalid-cursor' ? false : 10_000,
    refetchOnWindowFocus: (query) => !notificationAccessBlocked(query.state.error) && notificationError(query.state.error) !== 'invalid-cursor',
  });
  const read = useMutation({
    mutationKey: [...notificationKeys.scope(employeeId), 'mark-read'],
    mutationFn: notificationsService.markRead, retry: false,
    onSuccess: async () => {
      // Server acknowledgement first; never guess readAt or decrement an old count.
      await Promise.all([
        client.invalidateQueries({ queryKey: notificationKeys.count(employeeId) }),
        client.invalidateQueries({ queryKey: notificationKeys.inbox(employeeId) }),
      ]);
    },
  });

  useEffect(() => () => {
    void client.cancelQueries({ queryKey: notificationKeys.scope(employeeId) });
    client.removeQueries({ queryKey: notificationKeys.scope(employeeId), type: 'inactive' });
  }, [client, employeeId]);

  const refresh = async () => {
    await count.refetch();
    await client.resetQueries({ queryKey: notificationKeys.inbox(employeeId), exact: true });
  };
  return { count, inbox, read, online, refresh };
}
