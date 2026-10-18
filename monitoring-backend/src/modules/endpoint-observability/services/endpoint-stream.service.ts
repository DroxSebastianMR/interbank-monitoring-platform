import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OperationalEventsService } from '@/modules/realtime/services/operational-events.service';
import {
  OperationalChannel,
  OperationalEventType,
} from '@/modules/realtime/enums/operational-event.enum';
import { EndpointObservabilityService } from '@/modules/endpoint-observability/services/endpoint-observability.service';
import type {
  EndpointSnapshotDto,
  EndpointMetricDto,
} from '@/modules/endpoint-observability/dto/endpoint-snapshot.dto';

export const endpointKey = (item: EndpointMetricDto): string =>
  JSON.stringify([item.instance, item.method, item.route]);
export function endpointDelta(before: EndpointSnapshotDto | undefined, after: EndpointSnapshotDto) {
  const content = (item: EndpointMetricDto) => JSON.stringify({ ...item, observedAt: null });
  const previous = new Map(before?.endpoints.map((item) => [endpointKey(item), content(item)]));
  const current = new Set(after.endpoints.map(endpointKey));
  return {
    upserts: after.endpoints.filter((item) => previous.get(endpointKey(item)) !== content(item)),
    removed: [...previous.keys()].filter((key) => !current.has(key)),
  };
}

@Injectable()
export class EndpointStreamService implements OnModuleInit, OnModuleDestroy {
  private timer?: NodeJS.Timeout;
  private pending?: Promise<void>;
  private current?: EndpointSnapshotDto;
  constructor(
    private readonly catalog: EndpointObservabilityService,
    private readonly events: OperationalEventsService,
    private readonly config: ConfigService,
  ) {}
  onModuleInit() {
    if (this.config.get<boolean>('app.docsOnly', false)) return;
    this.timer = setInterval(() => {
      void this.update().catch(() => undefined);
    }, 5_000);
    this.timer.unref();
  }
  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }
  async snapshot() {
    await this.update();
    return { ...this.current!, cursor: this.events.cursor(OperationalChannel.ENDPOINTS) };
  }
  private update(): Promise<void> {
    if (this.pending) return this.pending;
    this.pending = this.collect().finally(() => {
      this.pending = undefined;
    });
    return this.pending;
  }
  private async collect(): Promise<void> {
    const snapshot = await this.catalog.snapshot();
    if (this.current === snapshot) return;
    const delta = endpointDelta(this.current, snapshot);
    const metadata = {
      sourceState: snapshot.sourceState,
      generatedAt: snapshot.generatedAt,
      lastSuccessAt: snapshot.lastSuccessAt,
      refreshIntervalMs: snapshot.refreshIntervalMs,
      windowSeconds: snapshot.windowSeconds,
      instances: snapshot.instances,
    };
    this.current = snapshot;
    const large = delta.upserts.length + delta.removed.length > 100;
    this.events.publish(
      OperationalChannel.ENDPOINTS,
      large ? OperationalEventType.RESYNC_REQUIRED : OperationalEventType.METRICS_UPDATED,
      large
        ? { reason: 'catalog-change', generatedAt: snapshot.generatedAt }
        : { ...delta, metadata },
    );
  }
}
