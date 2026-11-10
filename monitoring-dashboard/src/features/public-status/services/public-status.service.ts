import { z } from 'zod';

const status = z.enum(['OPERATIONAL', 'DEGRADED', 'UNAVAILABLE', 'NO_DATA']);
const notice = z.object({ id: z.string().uuid(), serviceKey: z.string(), sequence: z.number().int().positive(),
  kind: z.enum(['INITIAL', 'UPDATE', 'FOLLOW_UP', 'RECOVERY', 'SNAPSHOT', 'PREVENTIVE']), status,
  title: z.string().max(200), body: z.string().max(1000), templateVersion: z.string(),
  publishedAt: z.string().datetime(), expiresAt: z.string().datetime().nullable() });
const snapshot = z.object({ schemaVersion: z.literal(1), generatedAt: z.string().datetime(), environment: z.string(),
  services: z.array(z.object({ serviceKey: z.string(), name: z.string(), status, lastKnownStatus: status.nullable(),
    lastObservationAt: z.string().datetime().nullable(), observationMaxAgeMs: z.number().positive(), lastNotice: notice.nullable() })).max(100) });

async function publicGet(path: string, signal?: AbortSignal) {
  const base = (import.meta.env.VITE_PUBLIC_STATUS_API_URL || import.meta.env.VITE_API_URL || 'http://localhost:4000').replace(/\/$/, '');
  const response = await fetch(`${base}/public/status${path}`, { credentials: 'omit', cache: 'no-store',
    headers: { Accept: 'application/json' }, signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(5000)]) : AbortSignal.timeout(5000) });
  if (!response.ok) throw new Error('No se puede consultar el estado público.');
  return response.json() as Promise<unknown>;
}

export const publicStatusService = {
  snapshot: async (signal?: AbortSignal) => snapshot.parse(await publicGet('', signal)),
  history: async (service: string, cursor?: string, signal?: AbortSignal) => {
    const params = new URLSearchParams(); if (service) params.set('service', service); if (cursor) params.set('cursor', cursor);
    return z.object({ items: z.array(notice).max(20), nextCursor: z.string().uuid().nullable() }).parse(await publicGet(`/history?${params}`, signal));
  },
  notice: async (id: string, signal?: AbortSignal) => notice.parse(await publicGet(`/notices/${encodeURIComponent(id)}`, signal)),
};
export type PublicNotice = z.infer<typeof notice>;
