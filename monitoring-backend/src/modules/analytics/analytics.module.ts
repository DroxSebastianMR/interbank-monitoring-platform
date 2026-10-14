import { Module } from '@nestjs/common';
import { MonitoredServicesModule } from '@/modules/monitored-services/monitored-services.module';
import { AnalyticsController } from '@/modules/analytics/controllers/analytics.controller';
import { AnalyticsService } from '@/modules/analytics/services/analytics.service';
import { DashboardController } from '@/modules/analytics/controllers/dashboard.controller';
import { DashboardRepository } from '@/modules/analytics/repositories/dashboard.repository';
import { DashboardService } from '@/modules/analytics/services/dashboard.service';
@Module({
  imports: [MonitoredServicesModule],
  controllers: [AnalyticsController, DashboardController],
  providers: [AnalyticsService, DashboardService, DashboardRepository],
})
export class AnalyticsModule {}
