import { ApiProperty } from '@nestjs/swagger';
import {
  IsIn,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export const PLIN_NETWORKS = ['PLIN', 'YAPE'] as const;
export type PlinNetwork = (typeof PLIN_NETWORKS)[number];

export class EnrollPlinDto {
  @ApiProperty({ format: 'uuid' }) @IsUUID() accountId!: string;
}

export class ResolvePlinRecipientDto {
  @ApiProperty({ example: '987654321' }) @IsString() @Matches(/^9\d{8}$/) phoneNumber!: string;
  @ApiProperty({
    enum: PLIN_NETWORKS,
    required: false,
    description: 'El usuario selecciona el destino; no se deduce solo del teléfono',
  })
  @IsOptional()
  @IsIn(PLIN_NETWORKS)
  network?: PlinNetwork;
}

export class SavePlinFavoriteDto extends ResolvePlinRecipientDto {
  @ApiProperty({ required: false, maxLength: 80 })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  alias?: string;
}

export class PlinFavoriteResponseDto {
  @ApiProperty() phoneNumber!: string;
  @ApiProperty({ nullable: true, type: String }) alias!: string | null;
  @ApiProperty({ enum: PLIN_NETWORKS }) preferredNetwork!: PlinNetwork;
}

export class PlinRecentResponseDto {
  @ApiProperty() phoneNumber!: string;
  @ApiProperty({ enum: PLIN_NETWORKS }) network!: PlinNetwork;
  @ApiProperty({ format: 'date-time' }) lastPaymentAt!: string;
}

export class SendPlinDto extends ResolvePlinRecipientDto {
  @ApiProperty({ format: 'uuid' }) @IsUUID() fromAccountId!: string;
  @ApiProperty({ example: 25.5, minimum: 1, maximum: 500 })
  @IsNumber({ maxDecimalPlaces: 2, allowNaN: false, allowInfinity: false })
  @IsPositive()
  @Min(1)
  @Max(500)
  amount!: number;
}

export class PlinEnrollmentResponseDto {
  @ApiProperty() phoneNumber!: string;
  @ApiProperty({ format: 'uuid' }) accountId!: string;
  @ApiProperty() isActive!: boolean;
}

export class PlinRecipientResponseDto {
  @ApiProperty() phoneNumber!: string;
  @ApiProperty({ nullable: true, type: String }) displayName!: string | null;
  @ApiProperty({ enum: PLIN_NETWORKS }) network!: PlinNetwork;
  @ApiProperty() verified!: boolean;
  @ApiProperty() available!: boolean;
  @ApiProperty({ enum: PLIN_NETWORKS }) logoKey!: PlinNetwork;
}

export class PlinPaymentResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() operationNumber!: string;
  @ApiProperty() amount!: string;
  @ApiProperty({ enum: ['PEN'] }) currency!: 'PEN';
  @ApiProperty() recipientPhone!: string;
  @ApiProperty({ nullable: true, type: String }) senderPhone!: string | null;
  @ApiProperty({ enum: PLIN_NETWORKS }) network!: PlinNetwork;
  @ApiProperty({ format: 'date-time' }) createdAt!: string;
  @ApiProperty() replayed!: boolean;
  @ApiProperty() simulated!: boolean;
  @ApiProperty({ enum: ['SENT', 'RECEIVED'] }) direction!: 'SENT' | 'RECEIVED';
}
