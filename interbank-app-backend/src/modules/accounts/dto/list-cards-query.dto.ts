import { ApiPropertyOptional } from '@nestjs/swagger';
import { CardKind, CardStatus } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';

export class ListCardsQueryDto {
  @ApiPropertyOptional({ enum: CardKind }) @IsOptional() @IsEnum(CardKind) kind?: CardKind;
  @ApiPropertyOptional({ enum: CardStatus }) @IsOptional() @IsEnum(CardStatus) status?: CardStatus;
}
