import { Module } from '@nestjs/common';
import { HealthController } from '@/modules/health/controllers/health.controller';
import { HealthService } from '@/modules/health/services/health.service';
@Module({ controllers: [HealthController], providers: [HealthService] })
export class HealthModule {}
