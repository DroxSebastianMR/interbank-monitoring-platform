import { Module } from '@nestjs/common';
import { AlertsController } from '@/modules/alerts/controllers/alerts.controller';
import { AlertsRepository } from '@/modules/alerts/repositories/alerts.repository';
import { AlertsService } from '@/modules/alerts/services/alerts.service';

@Module({ controllers: [AlertsController], providers: [AlertsService, AlertsRepository] })
export class AlertsModule {}
