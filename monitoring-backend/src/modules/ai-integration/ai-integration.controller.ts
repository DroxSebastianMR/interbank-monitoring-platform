import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AiIntegrationService } from './ai-integration.service';
import { PredictDto } from './dto/predict.dto';
@ApiTags('ai-integration')
@Controller('ai')
export class AiIntegrationController {
  constructor(private readonly service: AiIntegrationService) {}
  @Get('health') health() {
    return this.service.health();
  }
  @Post('predict') predict(@Body() dto: PredictDto) {
    return this.service.predict(dto);
  }
}
