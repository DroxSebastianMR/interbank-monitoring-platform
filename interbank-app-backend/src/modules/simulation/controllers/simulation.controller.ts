import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { SetModeDto } from '@/modules/simulation/dto/set-mode.dto';
import { SimulationService } from '@/modules/simulation/services/simulation.service';

@ApiTags('simulation')
@Controller('simulation')
export class SimulationController {
  constructor(private readonly service: SimulationService) {}
  @Get() list() {
    return this.service.getModes();
  }
  @Post(':service/mode') set(@Param('service') service: string, @Body() dto: SetModeDto) {
    return this.service.setMode(service, dto.mode);
  }
}
