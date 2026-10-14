import { ApiProperty, ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { IsIn, IsInt, IsNotEmpty, IsString, Matches, MaxLength, Max, Min } from 'class-validator';

export class CreateMonitoredServiceDto {
  @ApiProperty({ example: 'login' })
  @IsString()
  @Matches(/^[a-z][a-z0-9-]{1,59}$/)
  code!: string;

  @ApiProperty({ example: 'Inicio de sesión' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name!: string;

  @ApiProperty({
    example: '/auth/health',
    description: 'Ruta relativa de solo lectura en el backend bancario configurado',
  })
  @IsString()
  @Matches(/^\/[a-z][a-z-]*\/health$/)
  endpoint!: string;

  @ApiProperty({ enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] })
  @IsIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])
  criticality!: string;
}

export class UpdateMonitoredServiceDto extends PartialType(
  OmitType(CreateMonitoredServiceDto, ['code'] as const),
) {
  @ApiProperty({ minimum: 1 })
  @IsInt()
  @Min(1)
  expectedVersion!: number;

  @ApiProperty({ maxLength: 500 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reason!: string;
}

export class PauseMonitoredServiceDto {
  @ApiProperty({ maxLength: 500 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reason!: string;
}

export class ValidateTargetDto {
  @ApiProperty({ example: '/auth/health' })
  @IsString()
  @Matches(/^\/[a-z][a-z-]*\/health$/)
  endpoint!: string;
}

export class ChecksQueryDto {
  @ApiPropertyOptional({ default: 50, minimum: 1, maximum: 100 })
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 50;
}
