import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsString, IsUUID, Matches, MaxLength, Min } from 'class-validator';
import { IncidentAttentionState, IncidentSeverity } from '@/modules/incidents/enums/incident-workflow.enum';

export class IncidentCommandDto {
  @ApiProperty({ minimum: 1 })
  @IsInt()
  @Min(1)
  expectedVersion!: number;

  @ApiProperty({ format: 'uuid', description: 'Conservar la misma clave al reintentar el mismo comando.' })
  @IsUUID()
  commandId!: string;

  @ApiProperty({ maxLength: 500 })
  @IsString()
  @Matches(/\S/)
  @MaxLength(500)
  reason!: string;
}

export class AssignIncidentDto extends IncidentCommandDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  assigneeId!: string;
}

export class AddIncidentNoteDto extends IncidentCommandDto {
  @ApiProperty({ maxLength: 2000 })
  @IsString()
  @Matches(/\S/)
  @MaxLength(2000)
  note!: string;
}

export class TransitionIncidentDto extends IncidentCommandDto {
  @ApiProperty({ enum: IncidentAttentionState })
  @IsEnum(IncidentAttentionState)
  nextState!: IncidentAttentionState;
}

export class ReclassifyIncidentDto extends IncidentCommandDto {
  @ApiProperty({ enum: IncidentSeverity })
  @IsEnum(IncidentSeverity)
  severity!: IncidentSeverity;
}

export class CloseIncidentDto extends IncidentCommandDto {
  @ApiProperty({ maxLength: 2000 })
  @IsString()
  @Matches(/\S/)
  @MaxLength(2000)
  summary!: string;
}
