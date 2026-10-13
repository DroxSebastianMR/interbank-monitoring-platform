import { Controller, Get } from '@nestjs/common';
import { AlertsService } from '@/modules/alerts/alerts.service';
@Controller('alerts')
export class AlertsController {
  constructor(private readonly service: AlertsService) {}
  @Get() all() {
    return this.service.findAll();
  }
}
