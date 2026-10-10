import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { AiIntegrationController } from '@/modules/ai-integration/ai-integration.controller';
import { AiIntegrationService } from '@/modules/ai-integration/ai-integration.service';
@Module({
  imports: [HttpModule.register({ timeout: 800 })],
  controllers: [AiIntegrationController],
  providers: [AiIntegrationService],
  exports: [AiIntegrationService],
})
export class AiIntegrationModule {}
