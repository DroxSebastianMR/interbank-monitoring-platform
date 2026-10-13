import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { HealthService } from '@/modules/health/health.service';
@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly service: HealthService) {}
  @Get() check() {
    return this.service.check();
  }
}
