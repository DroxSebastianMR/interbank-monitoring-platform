import { Controller, Get, Header } from '@nestjs/common';
import { HttpMetricsService } from '@/modules/metrics/services/http-metrics.service';

@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: HttpMetricsService) {}

  @Get()
  @Header('Content-Type', 'text/plain; version=0.0.4; charset=utf-8')
  metrics(): string {
    return this.metricsService.metrics();
  }
}
