import { Controller, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { MonitoringService } from './monitoring.service';
@ApiTags('monitoring')
@Controller('monitoring')
export class MonitoringController {
  constructor(private readonly service: MonitoringService) {}
  @Post('run') run() {
    return this.service.runAll();
  }
  @Post(':id/check') check(@Param('id') id: string) {
    return this.service.check(id);
  }
}
