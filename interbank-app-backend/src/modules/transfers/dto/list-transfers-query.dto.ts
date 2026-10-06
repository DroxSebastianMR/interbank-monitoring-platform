import { ApiPropertyOptional } from '@nestjs/swagger';
import { Currency, TransferKind } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsDateString, IsEnum, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';
import { TransferDirection } from '@/modules/transfers/enums/transfer-direction.enum';
import { TRANSFER_LIMITS } from '@/modules/transfers/constants/transfers.constants';

export class TransferSourceQueryDto {
  @ApiPropertyOptional({ enum: Currency }) @IsOptional() @IsEnum(Currency) currency?: Currency;
}
export class ListTransfersQueryDto extends TransferSourceQueryDto {
  @ApiPropertyOptional({ default: 20, maximum: 50 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(TRANSFER_LIMITS.maxPageSize)
  @IsOptional()
  limit: number = TRANSFER_LIMITS.defaultPageSize;
  @ApiPropertyOptional({ format: 'uuid' }) @IsOptional() @IsUUID() cursor?: string;
  @ApiPropertyOptional({ enum: TransferKind })
  @IsOptional()
  @IsEnum(TransferKind)
  kind?: TransferKind;
  @ApiPropertyOptional({ enum: TransferDirection })
  @IsOptional()
  @IsEnum(TransferDirection)
  direction?: TransferDirection;
  @ApiPropertyOptional({ format: 'uuid' }) @IsOptional() @IsUUID() accountId?: string;
  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsDateString({ strict: true })
  from?: string;
  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsDateString({ strict: true })
  to?: string;
}
