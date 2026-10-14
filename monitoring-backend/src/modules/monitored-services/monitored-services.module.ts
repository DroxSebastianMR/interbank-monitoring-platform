import { Module } from '@nestjs/common';
import { MonitoredServicesController } from '@/modules/monitored-services/controllers/monitored-services.controller';
import { MonitoredServicesService } from '@/modules/monitored-services/services/monitored-services.service';
import { MonitoredServicesRepository } from '@/modules/monitored-services/repositories/monitored-services.repository';
@Module({
  controllers: [MonitoredServicesController],
  providers: [MonitoredServicesService, MonitoredServicesRepository],
  exports: [MonitoredServicesService],
})
export class MonitoredServicesModule {}
