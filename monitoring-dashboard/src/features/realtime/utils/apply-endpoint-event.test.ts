import { describe, it, expect } from 'vitest';
import { applyEndpointEvent } from './apply-endpoint-event';
import { operationalEventSchema, type OperationalEvent } from '@/features/realtime/types/operational-event.schema';
import { TelemetryState } from '@/features/endpoints/enums/endpoint-state.enum';
import type { EndpointSnapshot } from '@/features/endpoints/types/endpoint.types';

const id = 'b6d8874b-fb19-4caa-8d9a-d85e807a7985';
const snapshot: EndpointSnapshot = { cursor: { streamId: id, sequence: 1 }, sourceState: TelemetryState.AVAILABLE, generatedAt: '2026-10-18T00:00:00.000Z', lastSuccessAt: null, instances: [], endpoints: [], refreshIntervalMs: 5000, windowSeconds: 120 };
const event: OperationalEvent = { eventId: id, correlationId: id, streamId: id, schemaVersion: 1, sequence: 2, timestamp: snapshot.generatedAt, channel: 'endpoints', eventType: 'metrics.updated', payload: { upserts: [], removed: [], metadata: snapshot } };
describe('Incremental operational stream', () => {
  it('advances the cursor after a valid delta', () => expect(applyEndpointEvent(snapshot, event)?.cursor?.sequence).toBe(2));
  it('ignores duplicates', () => expect(applyEndpointEvent(snapshot, { ...event, sequence: 1 })).toBe(snapshot));
  it('resynchronizes after gaps, restarts, large changes and invalid payloads', () => {
    expect(applyEndpointEvent(snapshot, { ...event, sequence: 3 })).toBeNull();
    expect(applyEndpointEvent(snapshot, { ...event, streamId: 'new-process' })).toBeNull();
    expect(applyEndpointEvent(snapshot, { ...event, eventType: 'resync.required' })).toBeNull();
    expect(applyEndpointEvent(snapshot, { ...event, payload: { upserts: 'bad' } })).toBeNull();
  });
  it('rejects incompatible versions before applying any data', () => expect(operationalEventSchema.safeParse({ ...event, schemaVersion: 2 }).success).toBe(false));
});
