import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsPositive, IsString, IsUUID, MaxLength } from 'class-validator';
export class CreateTransferDto {
  @ApiProperty() @IsUUID() fromAccountId!: string;
  @ApiProperty() @IsUUID() toAccountId!: string;
  @ApiProperty() @IsNumber() @IsPositive() amount!: number;
  @ApiProperty({ required: false, maxLength: 160 })
  @IsString()
  @MaxLength(160)
  @IsOptional()
  description?: string;
}
