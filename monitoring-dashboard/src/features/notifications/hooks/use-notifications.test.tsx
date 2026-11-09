import { QueryClient, QueryClientProvider, onlineManager } from '@tanstack/react-query';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/infrastructure/api/client/axios.interceptors';
import { useNotifications } from '@/features/notifications/hooks/use-notifications';
import { notificationsService } from '@/features/notifications/services/notifications.service';
import type { NotificationPage } from '@/features/notifications/types/notification.types';

vi.mock('@/features/notifications/services/notifications.service', () => ({
  notificationsService: { unreadCount: vi.fn(), inbox: vi.fn(), markRead: vi.fn() },
}));
const clients: QueryClient[] = [];
const id = '11111111-1111-4111-8111-111111111111';
const page = (readAt: string | null = null): NotificationPage => ({ items: [{
  id, incidentId: id, createdAt: '2026-11-09T10:00:00.000Z', readAt,
  eventType: 'incident.created', incident: null,
}], nextCursor: null });

function wrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  clients.push(client);
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

beforeEach(() => {
  vi.resetAllMocks(); onlineManager.setOnline(true);
  vi.mocked(notificationsService.unreadCount).mockResolvedValue({ unreadCount: 140 });
  vi.mocked(notificationsService.inbox).mockResolvedValue(page());
});
afterEach(() => { cleanup(); clients.splice(0).forEach((client) => client.clear()); });

describe('Notification queries', () => {
  it('counts beyond 100 without loading the inbox until the panel opens', async () => {
    const { result, rerender } = renderHook(({ open }) => useNotifications('employee-a', open), {
      initialProps: { open: false }, wrapper: wrapper(),
    });
    await waitFor(() => expect(result.current.count.data?.unreadCount).toBe(140));
    expect(notificationsService.inbox).not.toHaveBeenCalled();
    rerender({ open: true });
    await waitFor(() => expect(result.current.inbox.data?.pages[0].items[0].id).toBe(id));
  });

  it('waits for server acknowledgement before refreshing the read state and count', async () => {
    let acknowledge!: (value: { acknowledged: true }) => void;
    vi.mocked(notificationsService.markRead).mockReturnValue(new Promise((resolve) => { acknowledge = resolve; }));
    const { result } = renderHook(() => useNotifications('employee-a', true), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.inbox.isSuccess).toBe(true));
    act(() => result.current.read.mutate(id));
    await waitFor(() => expect(result.current.read.isPending).toBe(true));
    expect(result.current.count.data?.unreadCount).toBe(140);
    expect(result.current.inbox.data?.pages[0].items[0].readAt).toBeNull();
    vi.mocked(notificationsService.unreadCount).mockResolvedValue({ unreadCount: 139 });
    vi.mocked(notificationsService.inbox).mockResolvedValue(page('2026-11-09T10:01:00.000Z'));
    await act(async () => { acknowledge({ acknowledged: true }); });
    await waitFor(() => expect(result.current.read.isSuccess).toBe(true));
    expect(result.current.count.data?.unreadCount).toBe(139);
    expect(result.current.inbox.data?.pages[0].items[0].readAt).toBe('2026-11-09T10:01:00.000Z');
  });

  it('does not fabricate an empty inbox or a zero count when delivery is disabled', async () => {
    vi.mocked(notificationsService.unreadCount).mockRejectedValue(new ApiError(503, 'Operational inbox is not enabled'));
    const { result } = renderHook(() => useNotifications('employee-a', true), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.count.isError).toBe(true));
    expect(result.current.count.data).toBeUndefined();
    expect(notificationsService.inbox).not.toHaveBeenCalled();
  });

  it('never displays the previous employee count when the authenticated employee changes', async () => {
    const { result, rerender } = renderHook(({ employee }) => useNotifications(employee, false), {
      initialProps: { employee: 'employee-a' }, wrapper: wrapper(),
    });
    await waitFor(() => expect(result.current.count.data?.unreadCount).toBe(140));
    vi.mocked(notificationsService.unreadCount).mockResolvedValue({ unreadCount: 7 });
    rerender({ employee: 'employee-b' });
    expect(result.current.count.data?.unreadCount).not.toBe(140);
    await waitFor(() => expect(result.current.count.data?.unreadCount).toBe(7));
  });
});
