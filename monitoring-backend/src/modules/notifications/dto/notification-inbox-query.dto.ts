import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';

export class NotificationInboxQueryDto {
  @ApiPropertyOptional({ minimum: 1, maximum: 50, default: 20 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  @IsOptional()
  limit = 20;

  @ApiPropertyOptional({ format: 'uuid', description: 'nextCursor recibido en la página anterior.' })
  @IsUUID()
  @IsOptional()
  cursor?: string;
}
