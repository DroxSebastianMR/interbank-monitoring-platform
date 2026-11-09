import { z } from 'zod';
import { apiClient } from '@/infrastructure/api/client/axios.instance';
import { notificationPageSchema, unreadCountSchema } from '@/features/notifications/types/notification.types';

export const notificationsService = {
  unreadCount: async (signal: AbortSignal) => unreadCountSchema.parse(
    (await apiClient.get<unknown>('/notifications/unread-count', { signal, timeout: 10_000 })).data),
  inbox: async (cursor: string | undefined, signal: AbortSignal) => notificationPageSchema.parse(
    (await apiClient.get<unknown>('/notifications/inbox', { params: { limit: 20, cursor }, signal, timeout: 10_000 })).data),
  markRead: async (id: string) => z.object({ acknowledged: z.literal(true) }).parse(
    (await apiClient.patch<unknown>(`/notifications/${encodeURIComponent(id)}/read`, undefined, { timeout: 10_000 })).data),
};
