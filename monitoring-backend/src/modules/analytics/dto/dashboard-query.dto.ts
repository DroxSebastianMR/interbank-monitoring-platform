import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
} from 'class-validator';

export class DashboardMetricsQueryDto {
  @ApiPropertyOptional({ example: 'login' })
  @IsOptional()
  @IsString()
  @Matches(/^[a-z][a-z0-9-]{1,59}$/)
  serviceId?: string;

  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsDateString()
  to?: string;

  @ApiPropertyOptional({ enum: ['latency', 'availability', 'timeouts'] })
  @IsOptional()
  @IsIn(['latency', 'availability', 'timeouts'])
  metric?: 'latency' | 'availability' | 'timeouts';
}

export class DashboardActivityQueryDto {
  @ApiPropertyOptional({ default: 20, maximum: 100 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;
}
