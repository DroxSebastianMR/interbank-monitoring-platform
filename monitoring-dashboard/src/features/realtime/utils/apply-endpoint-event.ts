import type { EndpointSnapshot, EndpointMetric } from '@/features/endpoints/types/endpoint.types';
import { endpointDeltaSchema, type OperationalEvent } from '@/features/realtime/types/operational-event.schema';

export const endpointKey = (row: EndpointMetric): string => JSON.stringify([row.instance, row.method, row.route]);
/** null means the bounded stream cannot reconstruct state: fetch an authorized HTTP snapshot. */
export function applyEndpointEvent(current: EndpointSnapshot, event: OperationalEvent): EndpointSnapshot | null {
  if (!current.cursor || event.streamId !== current.cursor.streamId) return null;
  if (event.sequence <= current.cursor.sequence) return current;
  if (event.sequence !== current.cursor.sequence + 1 || event.eventType !== 'metrics.updated') return null;
  const delta = endpointDeltaSchema.safeParse(event.payload);
  if (!delta.success) return null;
  const rows = new Map(current.endpoints.map((row) => [endpointKey(row), row]));
  delta.data.removed.forEach((key) => rows.delete(key));
  delta.data.upserts.forEach((row) => rows.set(endpointKey(row), row));
  const observed = new Map(delta.data.metadata.instances.map((instance) => [instance.id, instance.observedAt]));
  const endpoints = [...rows.values()].map((row) => ({ ...row, observedAt: observed.get(row.instance) ?? null }));
  endpoints.sort((a, b) => a.module.localeCompare(b.module) || a.route.localeCompare(b.route) || a.method.localeCompare(b.method) || a.instance.localeCompare(b.instance));
  return { ...delta.data.metadata, endpoints, cursor: { streamId: event.streamId, sequence: event.sequence } };
}
