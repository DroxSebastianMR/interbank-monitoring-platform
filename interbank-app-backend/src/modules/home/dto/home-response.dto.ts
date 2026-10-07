import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AccountType } from '@prisma/client';

export class HomeBalanceSummaryDto {
  @ApiProperty({ enum: ['PEN', 'USD'] }) currency!: 'PEN' | 'USD';
  @ApiProperty({ example: '4250.50', description: 'Monto decimal serializado como string' })
  availableBalance!: string;
}

export class HomeAccountDto {
  @ApiProperty() id!: string;
  @ApiProperty({ example: 'Cuenta Simple Soles' }) displayName!: string;
  @ApiProperty({ example: '*********0001' }) maskedAccountNumber!: string;
  @ApiProperty({ example: '4250.50' }) availableBalance!: string;
  @ApiProperty({ enum: ['PEN', 'USD'] }) currency!: 'PEN' | 'USD';
  @ApiProperty({ enum: AccountType }) type!: AccountType;
}

export class HomeQuickActionDto {
  @ApiProperty({ example: 'TRANSFER' }) code!: string;
  @ApiProperty({ example: 'Transferir' }) label!: string;
  @ApiProperty({ example: '/transfers' }) path!: string;
  @ApiPropertyOptional({ example: 'Nuevo' }) badge?: string;
}

export class HomeTransactionDto {
  @ApiProperty() id!: string;
  @ApiProperty() accountId!: string;
  @ApiProperty() accountName!: string;
  @ApiProperty({ enum: ['DEPOSIT', 'TRANSFER', 'SERVICE_PAYMENT'] }) type!:
    'DEPOSIT' | 'TRANSFER' | 'SERVICE_PAYMENT';
  @ApiProperty({ enum: ['CREDIT', 'DEBIT'] }) direction!: 'CREDIT' | 'DEBIT';
  @ApiProperty({ enum: ['PENDING', 'COMPLETED', 'FAILED', 'REVERSED'] }) status!:
    'PENDING' | 'COMPLETED' | 'FAILED' | 'REVERSED';
  @ApiProperty({ example: '150.00' }) amount!: string;
  @ApiProperty({ enum: ['PEN', 'USD'] }) currency!: 'PEN' | 'USD';
  @ApiProperty() description!: string;
  @ApiProperty() occurredAt!: string;
}

export class HomeResponseDto {
  @ApiPropertyOptional({ example: 'Cliente' }) firstName?: string;
  @ApiProperty({ type: [HomeBalanceSummaryDto] }) balances!: HomeBalanceSummaryDto[];
  @ApiProperty({ type: [HomeAccountDto] }) accounts!: HomeAccountDto[];
  @ApiProperty({ type: [HomeQuickActionDto] }) quickActions!: HomeQuickActionDto[];
  @ApiProperty({ type: [HomeTransactionDto] }) recentTransactions!: HomeTransactionDto[];
}
