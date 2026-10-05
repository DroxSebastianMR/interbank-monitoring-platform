import { Controller, Get } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly service: AnalyticsService) {}
  @Get('summary') summary() {
    return this.service.summary();
  }
}
