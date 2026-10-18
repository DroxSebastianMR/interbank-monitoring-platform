import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { BankingAnalyticsService } from '@/modules/analytics/services/banking-analytics.service';
import { BankingAnalyticsController } from '@/modules/analytics/controllers/banking-analytics.controller';
import { MonitoredServicesModule } from '@/modules/monitored-services/monitored-services.module';
import { AnalyticsController } from '@/modules/analytics/controllers/analytics.controller';
import { AnalyticsService } from '@/modules/analytics/services/analytics.service';
import { DashboardController } from '@/modules/analytics/controllers/dashboard.controller';
import { DashboardRepository } from '@/modules/analytics/repositories/dashboard.repository';
import { DashboardService } from '@/modules/analytics/services/dashboard.service';
import { MonitoringModule } from '@/modules/monitoring/monitoring.module';
@Module({
  imports: [MonitoredServicesModule, MonitoringModule, HttpModule],
  controllers: [AnalyticsController, DashboardController, BankingAnalyticsController],
  providers: [AnalyticsService, DashboardService, DashboardRepository, BankingAnalyticsService],
})
export class AnalyticsModule {}
