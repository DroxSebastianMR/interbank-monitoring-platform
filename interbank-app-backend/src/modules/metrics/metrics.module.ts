import { Module } from '@nestjs/common';
import { MetricsController } from '@/modules/metrics/metrics.controller';

@Module({ controllers: [MetricsController] })
export class MetricsModule {}
