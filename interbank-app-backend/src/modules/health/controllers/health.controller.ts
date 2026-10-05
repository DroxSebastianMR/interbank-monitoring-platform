import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { HealthService } from '@/modules/health/services/health.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly service: HealthService) {}
  @Get() @ApiOkResponse({ description: 'Application instance is alive' }) check() {
    return this.service.check();
  }
}
