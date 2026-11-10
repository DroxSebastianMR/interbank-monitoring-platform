import { Injectable } from '@nestjs/common';
import type {
  CheckSample,
  MetricWindow,
} from '@/modules/monitoring/interfaces/metric-window.interface';

@Injectable()
export class MetricWindowService {
  private readonly samples = new Map<string, CheckSample[]>();
  private readonly windowMs = 60_000;

  clear(serviceId: string): void {
    this.samples.delete(serviceId);
  }

  record(serviceId: string, sample: CheckSample): MetricWindow {
    const previous = this.samples.get(serviceId) ?? [];
    const current = [...previous, sample].filter((entry) => entry.at > sample.at - this.windowMs);
    this.samples.set(serviceId, current);
    const count = current.length;
    const latencies = current.map((entry) => entry.latencyMs).sort((a, b) => a - b);
    const failures = current.filter((entry) => !entry.reachable).length;
    const timeouts = current.filter((entry) => entry.timedOut).length;
    return {
      serviceId,
      windowStart: new Date(sample.at - this.windowMs).toISOString(),
      windowEnd: new Date(sample.at).toISOString(),
      sampleCount: count,
      latencyP95Ms: latencies[Math.ceil(count * 0.95) - 1] ?? 0,
      errorRate: failures / count,
      timeoutRate: timeouts / count,
      requestRate: 0, // Legacy window field, not measured HTTP traffic. Never sent to AI as a substitute.
      availability: (count - failures) / count,
    };
  }
}
