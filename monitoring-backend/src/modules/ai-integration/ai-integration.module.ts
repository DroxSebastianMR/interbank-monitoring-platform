import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { AI_REQUEST_TIMEOUT_MS } from '@/modules/ai-integration/constants/ai-integration.constants';
import { AiIntegrationController } from '@/modules/ai-integration/controllers/ai-integration.controller';
import { AiIntegrationService } from '@/modules/ai-integration/services/ai-integration.service';
@Module({
  imports: [HttpModule.register({ timeout: AI_REQUEST_TIMEOUT_MS })],
  controllers: [AiIntegrationController],
  providers: [AiIntegrationService],
  exports: [AiIntegrationService],
})
export class AiIntegrationModule {}
