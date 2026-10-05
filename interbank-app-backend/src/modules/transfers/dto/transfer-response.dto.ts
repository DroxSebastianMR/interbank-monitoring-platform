import { ApiProperty } from '@nestjs/swagger';
import { Currency, TransactionStatus, TransferKind } from '@prisma/client';

export class TransferAccountResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() displayName!: string;
  @ApiProperty({ example: '*********0001' }) maskedAccountNumber!: string;
  @ApiProperty({ enum: Currency }) currency!: Currency;
}
export class TransferSourceResponseDto extends TransferAccountResponseDto {
  @ApiProperty({ example: '4250.50' }) availableBalance!: string;
  @ApiProperty() accountTypeName!: string;
}
export class TransferBeneficiaryResponseDto extends TransferAccountResponseDto {
  @ApiProperty({ example: 'Cliente D' }) beneficiaryName!: string;
  @ApiProperty({ enum: TransferKind }) kind!: TransferKind;
}
export class TransferResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() operationNumber!: string;
  @ApiProperty({ enum: TransferKind }) kind!: TransferKind;
  @ApiProperty({ enum: TransactionStatus }) status!: TransactionStatus;
  @ApiProperty({ format: 'uuid' }) fromAccountId!: string;
  @ApiProperty({ format: 'uuid' }) toAccountId!: string;
  @ApiProperty({ example: '125.50' }) amount!: string;
  @ApiProperty({ enum: Currency }) currency!: Currency;
  @ApiProperty({ type: String, nullable: true }) description!: string | null;
  @ApiProperty({ format: 'date-time' }) createdAt!: string;
  @ApiProperty({ type: String, format: 'date-time', nullable: true }) completedAt!: string | null;
  @ApiProperty({ type: TransferAccountResponseDto }) source!: TransferAccountResponseDto;
  @ApiProperty({ type: TransferAccountResponseDto }) destination!: TransferAccountResponseDto;
  @ApiProperty() isSender!: boolean;
  @ApiProperty() isRecipient!: boolean;
  @ApiProperty() replayed!: boolean;
}
export class TransferHistoryResponseDto {
  @ApiProperty({ type: [TransferResponseDto] }) items!: TransferResponseDto[];
  @ApiProperty({ type: String, nullable: true, format: 'uuid' }) nextCursor!: string | null;
  @ApiProperty() hasMore!: boolean;
}
