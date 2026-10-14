import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { MetricsController } from '@/modules/metrics/controllers/metrics.controller';
import { HttpMetricsMiddleware } from '@/modules/metrics/middleware/http-metrics.middleware';
import { HttpMetricsService } from '@/modules/metrics/services/http-metrics.service';

@Module({
  controllers: [MetricsController],
  providers: [HttpMetricsMiddleware, HttpMetricsService],
})
export class MetricsModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(HttpMetricsMiddleware).forRoutes('*');
  }
}
