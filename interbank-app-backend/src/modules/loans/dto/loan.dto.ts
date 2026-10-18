import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNumber, IsPositive, IsUUID, Max, Min } from 'class-validator';

export class LoanQuoteDto {
  @ApiProperty({ example: 10000, minimum: 1000, maximum: 50000 })
  @IsNumber({ maxDecimalPlaces: 2, allowNaN: false, allowInfinity: false })
  @IsPositive()
  @Min(1000)
  @Max(50000)
  principal!: number;
  @ApiProperty({ enum: [6, 12, 24, 36], example: 12 }) @IsIn([6, 12, 24, 36]) months!: number;
}

export class ApplyLoanDto extends LoanQuoteDto {
  @ApiProperty({ format: 'uuid' }) @IsUUID() destinationAccountId!: string;
}

export class LoanQuoteResponseDto {
  @ApiProperty({ example: '10000.00' }) principal!: string;
  @ApiProperty({ example: '24.0000' }) annualEffectiveRate!: string;
  @ApiProperty() months!: number;
  @ApiProperty({ example: '926.84' }) monthlyPayment!: string;
  @ApiProperty({ example: '11122.08' }) totalRepayment!: string;
  @ApiProperty() disclaimer!: string;
}

export class LoanApplicationResponseDto extends LoanQuoteResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid' }) destinationAccountId!: string;
  @ApiProperty({ enum: ['PENDING_REVIEW', 'CANCELLED', 'REJECTED', 'APPROVED'] }) status!: string;
  @ApiProperty({ format: 'date-time' }) createdAt!: string;
  @ApiProperty() replayed!: boolean;
}
