import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class InquireServiceDebtsDto {
  @ApiProperty({ example: 'LUZ_DEL_SUR_ELECTRICIDAD' })
  @IsString()
  @MaxLength(60)
  serviceCode!: string;

  @ApiProperty({ example: '123456789', description: 'Código de cliente, suministro o contrato' })
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  customerReference!: string;
}
