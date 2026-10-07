import { Controller, Get } from '@nestjs/common';
import { NotificationsService } from '@/modules/notifications/notifications.service';
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}
  @Get() all() {
    return this.service.findAll();
  }
}
