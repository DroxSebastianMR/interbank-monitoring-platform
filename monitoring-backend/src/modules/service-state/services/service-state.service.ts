import { Injectable } from '@nestjs/common';
import type { DetectionResult } from '@/modules/detection/interfaces/metric-input';
import { ServiceStatus } from '@/modules/service-state/interfaces/service-state';
@Injectable()
export class ServiceStateService {
  decide(
    current: ServiceStatus,
    detection: DetectionResult,
    reachable: boolean,
    consecutiveSuccesses = 1,
    observedBefore = true,
  ) {
    if (detection.severity === 'HIGH') return ServiceStatus.UNAVAILABLE;
    if (!reachable || detection.severity === 'MEDIUM') return ServiceStatus.DEGRADED;
    if (
      observedBefore &&
      (current === ServiceStatus.UNAVAILABLE ||
        current === ServiceStatus.DEGRADED ||
        current === ServiceStatus.RECOVERING) &&
      consecutiveSuccesses < 3
    )
      return ServiceStatus.RECOVERING;
    return ServiceStatus.OPERATIONAL;
  }
}
