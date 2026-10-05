import { Module } from '@nestjs/common';
import { MonitoredServicesController } from './monitored-services.controller';
import { MonitoredServicesService } from './monitored-services.service';
@Module({
  controllers: [MonitoredServicesController],
  providers: [MonitoredServicesService],
  exports: [MonitoredServicesService],
})
export class MonitoredServicesModule {}
