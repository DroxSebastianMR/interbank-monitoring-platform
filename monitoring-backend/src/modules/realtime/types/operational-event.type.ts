import type {
  OperationalChannel,
  OperationalEventType,
} from '@/modules/realtime/enums/operational-event.enum';

export interface OperationalEvent<T = unknown> {
  schemaVersion: 1;
  eventId: string;
  eventType: OperationalEventType;
  channel: OperationalChannel;
  streamId: string;
  sequence: number;
  timestamp: string;
  correlationId: string;
  payload: T;
}
