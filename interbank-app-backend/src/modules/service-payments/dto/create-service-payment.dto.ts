import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsPositive, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateServicePaymentDto {
  @ApiProperty() @IsUUID() accountId!: string;
  @ApiProperty({ example: 'LUZ_DEL_SUR_ELECTRICIDAD' })
  @IsString()
  @MaxLength(60)
  serviceCode!: string;
  @ApiProperty({ example: '123456789', description: 'Código de cliente, suministro o contrato' })
  @IsString()
  @MaxLength(80)
  customerReference!: string;
  @ApiProperty({ required: false, format: 'uuid', description: 'Recibo obtenido en la consulta' })
  @IsUUID()
  @IsOptional()
  debtId?: string;
  @ApiProperty({
    required: false,
    example: 120.5,
    description: 'Obligatorio solo en servicios sin consulta de deuda',
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @IsOptional()
  amount?: number;
}
