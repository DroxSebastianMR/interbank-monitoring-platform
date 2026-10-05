import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateSavedServicePaymentDto {
  @ApiProperty({ example: 'LUZ_DEL_SUR_ELECTRICIDAD' })
  @IsString()
  @MaxLength(60)
  serviceCode!: string;

  @ApiProperty({ example: '123456789' })
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  customerReference!: string;

  @ApiProperty({ example: 'Luz de casa' })
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  alias!: string;
}
