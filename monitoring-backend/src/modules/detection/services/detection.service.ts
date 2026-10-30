import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { DetectionResult, MetricInput } from '@/modules/detection/interfaces/metric-input';
@Injectable()
export class DetectionService {
  constructor(private readonly config: ConfigService) {}
  analyze(m: MetricInput): DetectionResult {
    const reasons: string[] = [];
    if (m.healthCheckFailures >= this.config.get<number>('rules.maxHealthFailures', 3))
      reasons.push('multiple health checks failed');
    else if (m.healthCheckFailures > 0) reasons.push('health check failed');
    if (m.latency > this.config.get<number>('rules.latencyThresholdMs', 1000))
      reasons.push('latency threshold exceeded');
    if (
      m.http?.errorRate != null &&
      m.http.errorRate >= this.config.get<number>('rules.httpErrorRateThreshold', 0.1)
    )
      reasons.push('HTTP 5xx error rate threshold exceeded');
    if (
      m.http?.latencyP95Ms != null &&
      m.http.latencyP95Ms > this.config.get<number>('rules.latencyThresholdMs', 1000)
    )
      reasons.push('HTTP latency threshold exceeded');
    // AI risk and historical probe failures never constitute a new technical failure.
    return {
      severity:
        m.healthCheckFailures >= this.config.get<number>('rules.maxHealthFailures', 3)
          ? 'HIGH'
          : reasons.length
            ? 'MEDIUM'
            : 'NONE',
      reasons,
    };
  }
}
