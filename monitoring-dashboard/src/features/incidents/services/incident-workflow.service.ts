import { z } from 'zod';
import { apiGet, apiPatch, apiPost } from '@/infrastructure/api/client/axios.instance';
import { incidentSchema } from '@/features/incidents/services/incidents.service';

const detailSchema = incidentSchema.extend({
  attentionState: z.enum(['DETECTED', 'INVESTIGATING', 'IDENTIFIED', 'RECOVERING', 'RESOLVED', 'CLOSED']),
  technicalStatus: z.string().nullable(), version: z.number().int().positive(), occurrence: z.number().int().positive(),
  assigneeId: z.string().nullable(), acknowledgedAt: z.string().nullable(), closedAt: z.string().nullable(),
  closingSummary: z.string().nullable(), previousIncidentId: z.string().nullable(), legacyArchived: z.boolean(),
  evidence: z.unknown().nullable(), lastEvidence: z.unknown().nullable(), recoveryEvidence: z.unknown().nullable(),
  closureBlockers: z.array(z.string()),
});
const personSchema = z.object({ id: z.string(), employeeCode: z.string(), firstName: z.string(), lastName: z.string() });
const eventSchema = z.object({
  id: z.string(), version: z.number().int(), occurrence: z.number().int(), kind: z.string(),
  origin: z.enum(['SYSTEM', 'OPERATOR', 'IMPORT']), reason: z.string(), createdAt: z.string(), payload: z.unknown().nullable(),
  actor: z.object({ id: z.string(), firstName: z.string(), lastName: z.string() }).nullable(),
});
const timelineSchema = z.object({ items: z.array(eventSchema).max(50), nextBeforeVersion: z.number().int().nullable() });
const receiptSchema = z.object({ incidentId: z.string(), eventId: z.string(), appliedVersion: z.number().int(), replayed: z.boolean() });
export type IncidentDetail = z.infer<typeof detailSchema>;
export type IncidentCommand = {
  action: 'assign' | 'acknowledge' | 'note' | 'transition' | 'reclassify' | 'close';
  body: { expectedVersion: number; commandId: string; reason: string; assigneeId?: string; note?: string; nextState?: string; severity?: string; summary?: string };
};
const targets = {
  assign: ['patch', 'assignment'], acknowledge: ['post', 'acknowledgement'], note: ['post', 'notes'],
  transition: ['patch', 'attention'], reclassify: ['patch', 'severity'], close: ['post', 'closure'],
} as const;
export const incidentWorkflowService = {
  detail: async (id: string) => detailSchema.parse(await apiGet<unknown>(`/incidents/${encodeURIComponent(id)}`)),
  assignees: async () => z.array(personSchema).max(100).parse(await apiGet<unknown>('/incidents/assignees')),
  timeline: async (id: string, before?: number) => timelineSchema.parse(await apiGet<unknown>(
    `/incidents/${encodeURIComponent(id)}/events${before === undefined ? '' : `?beforeVersion=${before}`}`)),
  execute: async (id: string, command: IncidentCommand) => {
    const [method, path] = targets[command.action];
    return receiptSchema.parse(await (method === 'patch' ? apiPatch : apiPost)<unknown>(
      `/incidents/${encodeURIComponent(id)}/${path}`, command.body));
  },
};
