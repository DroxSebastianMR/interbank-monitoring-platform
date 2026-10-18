import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  PromotionCategory,
  PromotionRedemptionMethod,
  PromotionVoucherStatus,
} from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';

export class ListPromotionsQueryDto {
  @ApiPropertyOptional({ enum: PromotionCategory })
  @IsOptional()
  @IsEnum(PromotionCategory)
  category?: PromotionCategory;
}

export class PromotionResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() title!: string;
  @ApiProperty() description!: string;
  @ApiProperty({ enum: PromotionCategory }) category!: PromotionCategory;
  @ApiProperty({ nullable: true, type: String }) imageUrl!: string | null;
  @ApiProperty({ nullable: true, type: String }) termsUrl!: string | null;
  @ApiProperty({ format: 'date-time' }) startsAt!: string;
  @ApiProperty({ format: 'date-time' }) endsAt!: string;
  @ApiProperty() isSaved!: boolean;
  @ApiProperty({ nullable: true, type: String }) merchantName!: string | null;
  @ApiProperty({ nullable: true, type: String }) merchantLogoUrl!: string | null;
  @ApiProperty({ enum: PromotionRedemptionMethod }) redemptionMethod!: PromotionRedemptionMethod;
  @ApiProperty() hasVoucher!: boolean;
}

export class PromotionVoucherResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid' }) promotionId!: string;
  @ApiProperty() code!: string;
  @ApiProperty({ enum: PromotionVoucherStatus }) status!: PromotionVoucherStatus;
  @ApiProperty({ format: 'date-time' }) issuedAt!: string;
  @ApiProperty({ format: 'date-time' }) expiresAt!: string;
  @ApiProperty({
    description: 'El código de esta instancia académica no es canjeable en comercios reales',
  })
  redeemableExternally!: boolean;
}
