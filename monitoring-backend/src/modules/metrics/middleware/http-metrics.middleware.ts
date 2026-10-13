import { Injectable, type NestMiddleware } from '@nestjs/common';
import { HttpMetricsService } from '@/modules/metrics/services/http-metrics.service';

@Injectable()
export class HttpMetricsMiddleware implements NestMiddleware {
  constructor(private readonly metrics: HttpMetricsService) {}

  use(
    request: { method: string; path: string; route?: { path: string } },
    response: { statusCode: number; once(event: 'finish', listener: () => void): void },
    next: () => void,
  ): void {
    this.metrics.observe(request, response, next);
  }
}
