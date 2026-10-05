import { ApiProperty } from '@nestjs/swagger';
import {
  AccountStatus,
  AccountType,
  CardFormat,
  CardKind,
  CardNetwork,
  CardStatus,
  Currency,
  TransactionDirection,
  TransactionStatus,
  TransactionType,
} from '@prisma/client';

export class AccountTypeResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ example: 'SIMPLE' }) code!: string;
  @ApiProperty() name!: string;
  @ApiProperty() description!: string;
  @ApiProperty({ enum: AccountType }) type!: AccountType;
  @ApiProperty({ enum: Currency, isArray: true }) supportedCurrencies!: Currency[];
  @ApiProperty() allowsDebits!: boolean;
  @ApiProperty() isActive!: boolean;
}
export class CardTypeResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ example: 'VISA_DEBIT_CLASSIC' }) code!: string;
  @ApiProperty() name!: string;
  @ApiProperty() description!: string;
  @ApiProperty({ enum: CardKind }) kind!: CardKind;
  @ApiProperty({ enum: CardNetwork }) network!: CardNetwork;
}
export class AccountResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() displayName!: string;
  @ApiProperty({ example: '*********0001', description: 'Número enmascarado' })
  accountNumber!: string;
  @ApiProperty({ example: '4250.50' }) balance!: string;
  @ApiProperty({ enum: Currency }) currency!: Currency;
  @ApiProperty({ enum: AccountType }) type!: AccountType;
  @ApiProperty({ enum: AccountStatus }) status!: AccountStatus;
  @ApiProperty({ type: AccountTypeResponseDto }) accountType!: AccountTypeResponseDto;
  @ApiProperty({ format: 'date-time' }) createdAt!: string;
  @ApiProperty({ type: String, nullable: true, format: 'date-time' }) closedAt!: string | null;
  @ApiProperty({ description: 'Habilitada para transferencias y pagos desde depósitos' })
  canDebit!: boolean;
}
export class AccountIdentifiersResponseDto {
  @ApiProperty({ format: 'uuid' }) accountId!: string;
  @ApiProperty() accountNumber!: string;
  @ApiProperty({ minLength: 20, maxLength: 20, description: 'CCI simulado propio de la cuenta' })
  cci!: string;
  @ApiProperty({ enum: Currency }) currency!: Currency;
  @ApiProperty({ example: true }) isSimulated!: boolean;
}
export class AccountBalanceResponseDto {
  @ApiProperty({ format: 'uuid' }) accountId!: string;
  @ApiProperty({ enum: Currency }) currency!: Currency;
  @ApiProperty({ example: '4250.50' }) availableBalance!: string;
  @ApiProperty({ enum: AccountStatus }) status!: AccountStatus;
  @ApiProperty() canDebit!: boolean;
}
export class CardCreditBalanceResponseDto {
  @ApiProperty({ enum: Currency }) currency!: Currency;
  @ApiProperty({ example: '5000.00' }) creditLimit!: string;
  @ApiProperty({ example: '125.50' }) outstandingBalance!: string;
  @ApiProperty({ example: '4874.50' }) availableCredit!: string;
}
export class CardResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() displayName!: string;
  @ApiProperty({ example: '**** **** **** 1234' }) maskedCardNumber!: string;
  @ApiProperty({ enum: CardKind }) kind!: CardKind;
  @ApiProperty({ enum: CardStatus }) status!: CardStatus;
  @ApiProperty({ enum: CardFormat }) format!: CardFormat;
  @ApiProperty({ type: CardTypeResponseDto }) cardType!: CardTypeResponseDto;
  @ApiProperty({ format: 'date' }) expiresAt!: string;
  @ApiProperty() isUsable!: boolean;
  @ApiProperty({ type: [CardCreditBalanceResponseDto] })
  creditBalances!: CardCreditBalanceResponseDto[];
}
export class AccountTransactionResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ enum: TransactionType }) type!: TransactionType;
  @ApiProperty({ enum: TransactionDirection }) direction!: TransactionDirection;
  @ApiProperty({ enum: TransactionStatus }) status!: TransactionStatus;
  @ApiProperty({ example: '125.50' }) amount!: string;
  @ApiProperty({ enum: Currency }) currency!: Currency;
  @ApiProperty() description!: string;
  @ApiProperty({ type: String, nullable: true }) reference!: string | null;
  @ApiProperty({ format: 'date-time' }) occurredAt!: string;
}
export class AccountStatementResponseDto {
  @ApiProperty({ type: [AccountTransactionResponseDto] }) items!: AccountTransactionResponseDto[];
  @ApiProperty({ type: String, nullable: true, format: 'uuid' }) nextCursor!: string | null;
  @ApiProperty() hasMore!: boolean;
}
