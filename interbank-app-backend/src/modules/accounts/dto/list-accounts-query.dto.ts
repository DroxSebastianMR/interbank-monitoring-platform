import { ApiPropertyOptional } from '@nestjs/swagger';
import { AccountStatus, AccountType, Currency } from '@prisma/client';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';

export class ListAccountsQueryDto {
  @ApiPropertyOptional({ enum: Currency }) @IsOptional() @IsEnum(Currency) currency?: Currency;
  @ApiPropertyOptional({ enum: AccountType }) @IsOptional() @IsEnum(AccountType) type?: AccountType;
  @ApiPropertyOptional({ enum: AccountStatus })
  @IsOptional()
  @IsEnum(AccountStatus)
  status?: AccountStatus;
  @ApiPropertyOptional({ format: 'uuid' }) @IsOptional() @IsUUID() accountTypeId?: string;
}
