import { z } from 'zod';

const incidentSummarySchema = z.object({
  id: z.string().uuid(), serviceKey: z.string(), title: z.string(), status: z.string(),
  severity: z.string(), attentionState: z.string(),
});

export const notificationSchema = z.object({
  id: z.string().uuid(), incidentId: z.string().uuid(), eventType: z.string(),
  createdAt: z.string().datetime(), readAt: z.string().datetime().nullable(),
  incident: incidentSummarySchema.nullable(),
});
export const notificationPageSchema = z.object({
  items: z.array(notificationSchema).max(20), nextCursor: z.string().uuid().nullable(),
});
export const unreadCountSchema = z.object({ unreadCount: z.number().int().nonnegative() });

export type Notification = z.infer<typeof notificationSchema>;
export type NotificationPage = z.infer<typeof notificationPageSchema>;
