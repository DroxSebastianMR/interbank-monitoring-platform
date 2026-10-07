import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from '@/config/configuration';
import { validate } from '@/config/env.validation';
import { PrismaModule } from '@/database/prisma/prisma.module';
import { RedisModule } from '@/redis/redis.module';
import { QueuesModule } from '@/queues/queues.module';
import { AiIntegrationModule } from '@/modules/ai-integration/ai-integration.module';
import { DetectionModule } from '@/modules/detection/detection.module';
import { HealthModule } from '@/modules/health/health.module';
import { MonitoredServicesModule } from '@/modules/monitored-services/monitored-services.module';
import { MonitoringModule } from '@/modules/monitoring/monitoring.module';
import { ServiceStateModule } from '@/modules/service-state/service-state.module';
import { IncidentsModule } from '@/modules/incidents/incidents.module';
import { AlertsModule } from '@/modules/alerts/alerts.module';
import { NotificationsModule } from '@/modules/notifications/notifications.module';
import { MetricsModule } from '@/modules/metrics/metrics.module';
import { AuthModule } from '@/modules/auth/auth.module';
import { AccessControlModule } from '@/modules/access-control/access-control.module';
import { AnalyticsModule } from '@/modules/analytics/analytics.module';
import { AuditModule } from '@/modules/audit/audit.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration], validate }),
    PrismaModule,
    RedisModule,
    QueuesModule,
    AuthModule,
    AccessControlModule,
    AiIntegrationModule,
    DetectionModule,
    ServiceStateModule,
    MonitoredServicesModule,
    MonitoringModule,
    MetricsModule,
    IncidentsModule,
    AlertsModule,
    NotificationsModule,
    AnalyticsModule,
    AuditModule,
    HealthModule,
  ],
})
export class AppModule {}
