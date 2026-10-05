import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

import { SimulationMode } from '@/modules/simulation/services/simulation.service';

export class SetModeDto {
  @ApiProperty({ enum: SimulationMode }) @IsEnum(SimulationMode) mode!: SimulationMode;
}
