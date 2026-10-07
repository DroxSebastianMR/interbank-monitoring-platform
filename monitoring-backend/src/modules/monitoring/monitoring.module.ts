import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { DetectionModule } from '@/modules/detection/detection.module';
import { MonitoredServicesModule } from '@/modules/monitored-services/monitored-services.module';
import { ServiceStateModule } from '@/modules/service-state/service-state.module';
import { MonitoringController } from '@/modules/monitoring/monitoring.controller';
import { MonitoringService } from '@/modules/monitoring/monitoring.service';
@Module({
  imports: [HttpModule, DetectionModule, MonitoredServicesModule, ServiceStateModule],
  controllers: [MonitoringController],
  providers: [MonitoringService],
})
export class MonitoringModule {}
