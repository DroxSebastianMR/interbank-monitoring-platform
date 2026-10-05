import { Module } from '@nestjs/common';
import { MonitoredServicesModule } from '../monitored-services/monitored-services.module';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
@Module({
  imports: [MonitoredServicesModule],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
})
export class AnalyticsModule {}
