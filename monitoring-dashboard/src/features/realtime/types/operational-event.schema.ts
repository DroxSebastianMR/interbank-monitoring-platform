import { z } from 'zod';
import { TelemetryState, EndpointTrafficState } from '@/features/endpoints/enums/endpoint-state.enum';

const metric = z.number().finite().nonnegative().nullable();
const timestamp = z.string().datetime();
const endpoint = z.object({
  operationId: z.string().optional(), application: z.string().optional(), version: z.string().optional(), controlPolicy: z.string().optional(), latencyP50Ms: metric.optional(), latencyP99Ms: metric.optional(),
  instance: z.string().max(200), module: z.string().max(200), method: z.string().max(10), route: z.string().max(2048),
  state: z.enum(TelemetryState), traffic: z.enum(EndpointTrafficState), observedAt: timestamp.nullable(),
  requestRateHz: metric, clientErrorRateHz: metric, serverErrorRateHz: metric, latencyP95Ms: metric, observedRequests: metric,
});
const metadata = z.object({
  sourceState: z.enum(TelemetryState), generatedAt: timestamp, lastSuccessAt: timestamp.nullable(),
  refreshIntervalMs: z.number().positive(), windowSeconds: z.number().positive(),
  instances: z.array(z.object({ id: z.string(), state: z.enum(TelemetryState), observedAt: timestamp.nullable(), endpointCount: z.number().int().nonnegative() })).max(200),
});
export const operationalEventSchema = z.object({
  schemaVersion: z.literal(1), eventId: z.string().uuid(), streamId: z.string().uuid(), correlationId: z.string().uuid(),
  channel: z.enum(['endpoints', 'incidents']), sequence: z.number().int().positive(), timestamp,
  eventType: z.enum(['metrics.updated', 'resync.required', 'incident.created', 'incident.updated']), payload: z.unknown(),
});
export type OperationalEvent = z.infer<typeof operationalEventSchema>;
export const endpointDeltaSchema = z.object({ upserts: z.array(endpoint).max(100), removed: z.array(z.string()).max(100), metadata });
export const liveSnapshotSchema = metadata.extend({ endpoints: z.array(endpoint).max(10000), cursor: z.object({ streamId: z.string().uuid(), sequence: z.number().int().nonnegative() }) });
