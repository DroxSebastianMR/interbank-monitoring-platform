import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { HttpModule } from '@nestjs/axios';
import { AiIntegrationModule } from '@/modules/ai-integration/ai-integration.module';
import { AssistantController } from '@/modules/assistant/controllers/assistant.controller';
import { AssistantService } from '@/modules/assistant/services/assistant.service';
import { AssistantRepository } from '@/modules/assistant/repositories/assistant.repository';
import { PrometheusMetricsService } from '@/modules/monitoring/services/prometheus-metrics.service';
import { AuthModule } from '@/modules/auth/auth.module';
import { IncidentsModule } from '@/modules/incidents/incidents.module';
import { MonitoredServicesModule } from '@/modules/monitored-services/monitored-services.module';

@Module({
  imports: [
    AiIntegrationModule,
    HttpModule,
    AuthModule,
    IncidentsModule,
    MonitoredServicesModule,
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 10 }]),
  ],
  controllers: [AssistantController],
  providers: [AssistantService, AssistantRepository, PrometheusMetricsService],
})
export class AssistantModule {}
