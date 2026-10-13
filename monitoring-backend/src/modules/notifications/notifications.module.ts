import { Module } from '@nestjs/common';
import { NotificationsController } from '@/modules/notifications/controllers/notifications.controller';
import { NotificationsService } from '@/modules/notifications/services/notifications.service';
@Module({ controllers: [NotificationsController], providers: [NotificationsService] })
export class NotificationsModule {}
