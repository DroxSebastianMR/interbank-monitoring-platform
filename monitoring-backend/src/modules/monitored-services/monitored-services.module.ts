import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { MonitoredServicesController } from '@/modules/monitored-services/controllers/monitored-services.controller';
import { MonitoredServicesService } from '@/modules/monitored-services/services/monitored-services.service';
import { MonitoredServicesRepository } from '@/modules/monitored-services/repositories/monitored-services.repository';
import { ServiceDiscoveryService } from '@/modules/monitored-services/services/service-discovery.service';
@Module({
  imports: [HttpModule],
  controllers: [MonitoredServicesController],
  providers: [MonitoredServicesService, MonitoredServicesRepository, ServiceDiscoveryService],
  exports: [MonitoredServicesService],
})
export class MonitoredServicesModule {}
