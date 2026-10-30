import { z } from 'zod';
import { apiGet } from '@/infrastructure/api/client/axios.instance';

export const incidentSchema = z.object({ id: z.string(), serviceKey: z.string(), title: z.string(), status: z.string(), severity: z.string(), openedAt: z.string(), lastObservedAt: z.string(), resolvedAt: z.string().nullable(), attentionState: z.string().optional(), assignee: z.object({ id: z.string(), firstName: z.string(), lastName: z.string() }).nullable().optional() });
const alert = z.object({ id: z.string(), incidentId: z.string(), kind: z.string(), message: z.string(), createdAt: z.string() });
export type Incident = z.infer<typeof incidentSchema>;
export const incidentsService = {
  list: async () => z.array(incidentSchema).max(100).parse(await apiGet<unknown>('/incidents')),
  alerts: async () => z.array(alert).max(100).parse(await apiGet<unknown>('/alerts')),
};
