import { Injectable } from '@nestjs/common';
import { DetectionResult } from '../detection/interfaces/metric-input';
import { ServiceStatus } from './interfaces/service-state';
@Injectable()
export class ServiceStateService {
  decide(current: ServiceStatus, detection: DetectionResult, reachable: boolean) {
    if (!reachable || detection.severity === 'HIGH') return ServiceStatus.UNAVAILABLE;
    if (detection.severity === 'MEDIUM') return ServiceStatus.DEGRADED;
    if (current === ServiceStatus.UNAVAILABLE || current === ServiceStatus.DEGRADED)
      return ServiceStatus.RECOVERING;
    return ServiceStatus.OPERATIONAL;
  }
}
