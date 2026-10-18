import { Module } from '@nestjs/common';
import { OperationalAnalyticsController } from '@/modules/operational-analytics/controllers/operational-analytics.controller';
import { OperationalAnalyticsService } from '@/modules/operational-analytics/services/operational-analytics.service';
import { OperationalAnalyticsRepository } from '@/modules/operational-analytics/repositories/operational-analytics.repository';
import { AnalyticsTokenGuard } from '@/modules/operational-analytics/guards/analytics-token.guard';
@Module({ controllers: [OperationalAnalyticsController], providers: [OperationalAnalyticsService, OperationalAnalyticsRepository, AnalyticsTokenGuard] })
export class OperationalAnalyticsModule {}
