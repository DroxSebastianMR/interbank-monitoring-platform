import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { DetectionModule } from '../detection/detection.module';
import { MonitoredServicesModule } from '../monitored-services/monitored-services.module';
import { ServiceStateModule } from '../service-state/service-state.module';
import { MonitoringController } from './monitoring.controller';
import { MonitoringService } from './monitoring.service';
@Module({
  imports: [HttpModule, DetectionModule, MonitoredServicesModule, ServiceStateModule],
  controllers: [MonitoringController],
  providers: [MonitoringService],
})
export class MonitoringModule {}
