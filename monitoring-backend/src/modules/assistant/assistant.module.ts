import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { AiIntegrationModule } from '@/modules/ai-integration/ai-integration.module';
import { AssistantController } from '@/modules/assistant/assistant.controller';
import { AssistantService } from '@/modules/assistant/assistant.service';
import { AuthModule } from '@/modules/auth/auth.module';
import { IncidentsModule } from '@/modules/incidents/incidents.module';
import { MonitoredServicesModule } from '@/modules/monitored-services/monitored-services.module';

@Module({
  imports: [
    AiIntegrationModule,
    AuthModule,
    IncidentsModule,
    MonitoredServicesModule,
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 10 }]),
  ],
  controllers: [AssistantController],
  providers: [AssistantService],
})
export class AssistantModule {}
