import { Controller, Get } from '@nestjs/common';
import { IncidentsService } from '@/modules/incidents/incidents.service';
@Controller('incidents')
export class IncidentsController {
  constructor(private readonly service: IncidentsService) {}
  @Get() all() {
    return this.service.findAll();
  }
}
