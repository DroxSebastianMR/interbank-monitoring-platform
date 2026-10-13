import { Module } from '@nestjs/common';
import { NotificationsController } from '@/modules/notifications/notifications.controller';
import { NotificationsService } from '@/modules/notifications/notifications.service';
@Module({ controllers: [NotificationsController], providers: [NotificationsService] })
export class NotificationsModule {}
