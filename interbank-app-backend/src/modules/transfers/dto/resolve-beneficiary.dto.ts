import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, Matches } from 'class-validator';

export class ResolveBeneficiaryDto {
  @ApiProperty({
    example: '2003000000001',
    description: 'Número de cuenta del banco simulado; admite espacios y guiones',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.replace(/[\s-]/g, '') : value,
  )
  @IsString()
  @Matches(/^\d{10,20}$/)
  accountNumber!: string;
}
