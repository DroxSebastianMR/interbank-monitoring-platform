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
    degradationConfirmed = true,
    recoverySamples = 3,
    lastConfirmedStatus: ServiceStatus | null = current,
  ) {
    if (detection.severity === 'HIGH') return ServiceStatus.UNAVAILABLE;
    if (!reachable || detection.severity === 'MEDIUM') {
      // An unavailable service stays unavailable until healthy recovery is confirmed.
      if (current === ServiceStatus.UNAVAILABLE) return current;
      if (current === ServiceStatus.RECOVERING &&
        (lastConfirmedStatus === ServiceStatus.UNAVAILABLE || lastConfirmedStatus === ServiceStatus.DEGRADED)) {
        return lastConfirmedStatus;
      }
      return degradationConfirmed ? ServiceStatus.DEGRADED : current;
    }
    if (
      observedBefore &&
      (current === ServiceStatus.UNAVAILABLE ||
        current === ServiceStatus.DEGRADED ||
        current === ServiceStatus.RECOVERING) &&
      consecutiveSuccesses < recoverySamples
    )
      return ServiceStatus.RECOVERING;
    return ServiceStatus.OPERATIONAL;
  }
}
