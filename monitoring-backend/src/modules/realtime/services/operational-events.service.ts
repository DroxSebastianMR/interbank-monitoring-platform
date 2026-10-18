import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Subject } from 'rxjs';
import {
  OperationalChannel,
  OperationalEventType,
} from '@/modules/realtime/enums/operational-event.enum';
import type { OperationalEvent } from '@/modules/realtime/types/operational-event.type';

@Injectable()
export class OperationalEventsService implements OnModuleDestroy {
  readonly streamId = randomUUID();
  private readonly subject = new Subject<OperationalEvent>();
  private readonly sequences = new Map<OperationalChannel, number>();
  readonly events = this.subject.asObservable();

  cursor(channel: OperationalChannel) {
    return { streamId: this.streamId, sequence: this.sequences.get(channel) ?? 0 };
  }

  publish<T>(
    channel: OperationalChannel,
    eventType: OperationalEventType,
    payload: T,
  ): OperationalEvent<T> {
    const sequence = (this.sequences.get(channel) ?? 0) + 1;
    this.sequences.set(channel, sequence);
    const event: OperationalEvent<T> = {
      schemaVersion: 1,
      eventId: randomUUID(),
      eventType,
      channel,
      streamId: this.streamId,
      sequence,
      timestamp: new Date().toISOString(),
      correlationId: randomUUID(),
      payload,
    };
    this.subject.next(event);
    return event;
  }
  onModuleDestroy() {
    this.subject.complete();
  }
}
