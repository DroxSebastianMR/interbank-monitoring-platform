import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { TransactionDirection, TransactionStatus, TransactionType } from '@prisma/client';
import { IsDateString, IsEnum, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';
import { ACCOUNTS_LIMITS } from '@/modules/accounts/constants/accounts.constants';

export class ListTransactionsQueryDto {
  @ApiPropertyOptional({
    default: ACCOUNTS_LIMITS.defaultTransactions,
    minimum: 1,
    maximum: ACCOUNTS_LIMITS.maxTransactions,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(ACCOUNTS_LIMITS.maxTransactions)
  @IsOptional()
  limit: number = ACCOUNTS_LIMITS.defaultTransactions;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'ID del último movimiento de la página previa',
  })
  @IsOptional()
  @IsUUID()
  cursor?: string;
  @ApiPropertyOptional({ enum: TransactionType })
  @IsOptional()
  @IsEnum(TransactionType)
  type?: TransactionType;
  @ApiPropertyOptional({ enum: TransactionDirection })
  @IsOptional()
  @IsEnum(TransactionDirection)
  direction?: TransactionDirection;
  @ApiPropertyOptional({ enum: TransactionStatus })
  @IsOptional()
  @IsEnum(TransactionStatus)
  status?: TransactionStatus;
  @ApiPropertyOptional({ format: 'date-time', description: 'Límite inferior inclusivo (ISO 8601)' })
  @IsOptional()
  @IsDateString({ strict: true })
  from?: string;
  @ApiPropertyOptional({ format: 'date-time', description: 'Límite superior inclusivo (ISO 8601)' })
  @IsOptional()
  @IsDateString({ strict: true })
  to?: string;
}
