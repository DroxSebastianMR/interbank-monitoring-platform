import { Module } from '@nestjs/common';
import { AlertsController } from '@/modules/alerts/alerts.controller';
import { AlertsService } from '@/modules/alerts/alerts.service';
@Module({ controllers: [AlertsController], providers: [AlertsService] })
export class AlertsModule {}
