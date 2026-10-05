import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DetectionResult, MetricInput } from './interfaces/metric-input';
@Injectable()
export class DetectionService {
  constructor(private readonly config: ConfigService) {}
  analyze(m: MetricInput): DetectionResult {
    const reasons: string[] = [];
    if (m.healthCheckFailures >= this.config.get<number>('rules.maxHealthFailures', 2))
      reasons.push('multiple health checks failed');
    if (m.latency > this.config.get<number>('rules.latencyThresholdMs', 1000))
      reasons.push('latency threshold exceeded');
    if (m.errorRate >= 0.1) reasons.push('high error rate');
    if (m.timeoutRate >= 0.05) reasons.push('high timeout rate');
    if (m.aiAnomalyScore >= 0.8) reasons.push('AI anomaly risk');
    return {
      severity:
        reasons.length >= 2 || m.availability === 0 ? 'HIGH' : reasons.length ? 'MEDIUM' : 'NONE',
      reasons,
    };
  }
}
