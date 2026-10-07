import { Module } from '@nestjs/common';
import { MonitoredServicesController } from '@/modules/monitored-services/monitored-services.controller';
import { MonitoredServicesService } from '@/modules/monitored-services/monitored-services.service';
@Module({
  controllers: [MonitoredServicesController],
  providers: [MonitoredServicesService],
  exports: [MonitoredServicesService],
})
export class MonitoredServicesModule {}
