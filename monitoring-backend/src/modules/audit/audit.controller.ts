import { Controller, Get } from '@nestjs/common';
import { AuditService } from './audit.service';
@Controller('audit')
export class AuditController {
  constructor(private readonly service: AuditService) {}
  @Get() recent() {
    return this.service.findRecent();
  }
}
