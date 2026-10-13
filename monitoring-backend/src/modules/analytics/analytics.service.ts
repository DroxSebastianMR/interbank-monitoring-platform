import { Injectable } from '@nestjs/common';
import { MonitoredServicesService } from '@/modules/monitored-services/monitored-services.service';
@Injectable()
export class AnalyticsService {
  constructor(private readonly services: MonitoredServicesService) {}
  summary() {
    const services = this.services.findAll();
    const byStatus = services.reduce<Record<string, number>>((counts, service) => {
      counts[service.status] = (counts[service.status] ?? 0) + 1;
      return counts;
    }, {});
    return { total: services.length, byStatus };
  }
}
