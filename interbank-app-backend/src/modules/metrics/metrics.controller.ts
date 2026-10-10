import { Controller, Get, Header } from '@nestjs/common';
import { httpMetricsRegistry } from '@/modules/metrics/http-metrics';

@Controller('metrics')
export class MetricsController {
  @Get()
  @Header('Content-Type', 'text/plain; version=0.0.4; charset=utf-8')
  metrics(): Promise<string> {
    return httpMetricsRegistry.metrics();
  }
}
