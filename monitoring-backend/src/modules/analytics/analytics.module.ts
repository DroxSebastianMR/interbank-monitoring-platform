import { Module } from '@nestjs/common';
import { MonitoredServicesModule } from '@/modules/monitored-services/monitored-services.module';
import { AnalyticsController } from '@/modules/analytics/controllers/analytics.controller';
import { AnalyticsService } from '@/modules/analytics/services/analytics.service';
@Module({
  imports: [MonitoredServicesModule],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
})
export class AnalyticsModule {}
