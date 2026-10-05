import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

import {
  SERVICE_PAYMENT_DEFAULT_PAGE_SIZE,
  SERVICE_PAYMENT_MAX_PAGE_SIZE,
} from '@/modules/service-payments/constants/service-payment.constants';

export class ListServicePaymentsQueryDto {
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
