import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { MonitoredServicesService } from './monitored-services.service';
@ApiTags('monitored-services')
@Controller('monitored-services')
export class MonitoredServicesController {
  constructor(private readonly service: MonitoredServicesService) {}
  @Get() findAll() {
    return this.service.findAll();
  }
}
