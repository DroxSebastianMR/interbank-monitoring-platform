import { ConfigService } from '@nestjs/config';
import { DetectionService } from '@/modules/detection/services/detection.service';
describe('DetectionService', () => {
  it('flags failed health checks', () => {
    const service = new DetectionService(
      new ConfigService({ rules: { maxHealthFailures: 2, latencyThresholdMs: 1000 } }),
    );
    expect(
      service.analyze({
        latency: 20,
        errorRate: 0,
        timeoutRate: 0,
        availability: 0,
        requestRate: 0,
        healthCheckFailures: 2,
        aiAnomalyScore: 0,
      }).severity,
    ).toBe('HIGH');
  });
});
