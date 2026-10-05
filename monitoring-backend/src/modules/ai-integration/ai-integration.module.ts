import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { AiIntegrationController } from './ai-integration.controller';
import { AiIntegrationService } from './ai-integration.service';
@Module({
  imports: [HttpModule.register({ timeout: 3000 })],
  controllers: [AiIntegrationController],
  providers: [AiIntegrationService],
  exports: [AiIntegrationService],
})
export class AiIntegrationModule {}
