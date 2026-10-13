import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { DetectionModule } from '@/modules/detection/detection.module';
import { AiIntegrationModule } from '@/modules/ai-integration/ai-integration.module';
import { IncidentsModule } from '@/modules/incidents/incidents.module';
import { MonitoredServicesModule } from '@/modules/monitored-services/monitored-services.module';
import { ServiceStateModule } from '@/modules/service-state/service-state.module';
import { MonitoringController } from '@/modules/monitoring/controllers/monitoring.controller';
import { MonitoringService } from '@/modules/monitoring/services/monitoring.service';
import { MetricWindowService } from '@/modules/monitoring/services/metric-window.service';
import { PrometheusMetricsService } from '@/modules/monitoring/services/prometheus-metrics.service';
@Module({
  imports: [
    HttpModule,
    AiIntegrationModule,
    DetectionModule,
    IncidentsModule,
    MonitoredServicesModule,
    ServiceStateModule,
  ],
  controllers: [MonitoringController],
  providers: [MonitoringService, MetricWindowService, PrometheusMetricsService],
})
export class MonitoringModule {}
