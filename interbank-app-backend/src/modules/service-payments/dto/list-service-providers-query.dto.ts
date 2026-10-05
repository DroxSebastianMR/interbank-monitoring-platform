import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

import {
  SERVICE_PAYMENT_DEFAULT_PAGE_SIZE,
  SERVICE_PAYMENT_MAX_PAGE_SIZE,
} from '@/modules/service-payments/constants/service-payment.constants';

export class ListServiceProvidersQueryDto {
  @ApiPropertyOptional({ example: 'UTILITIES' })
  @IsString()
  @MaxLength(40)
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({ example: 'luz' })
  @IsString()
  @MaxLength(80)
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    default: SERVICE_PAYMENT_DEFAULT_PAGE_SIZE,
    maximum: SERVICE_PAYMENT_MAX_PAGE_SIZE,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(SERVICE_PAYMENT_MAX_PAGE_SIZE)
  @IsOptional()
  limit = SERVICE_PAYMENT_DEFAULT_PAGE_SIZE;
}
