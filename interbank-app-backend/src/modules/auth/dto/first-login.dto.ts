import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, Length, Matches, MaxLength } from 'class-validator';

import { AUTH_LIMITS, DNI_PATTERN } from '@/modules/auth/constants/auth.constants';

export class FirstLoginDto {
  @ApiProperty({ example: '12345678', description: 'DNI peruano de 8 dígitos' })
  @IsString()
  @Matches(DNI_PATTERN, { message: 'documentNumber must contain exactly 8 digits' })
  documentNumber!: string;

  @ApiProperty({ example: 'cliente@interbank.test' })
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @ApiProperty({ example: 'DemoSecure123!', minLength: AUTH_LIMITS.passwordMinLength })
  @IsString()
  @Length(AUTH_LIMITS.passwordMinLength, AUTH_LIMITS.passwordMaxLength)
  password!: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Identificador estable generado por la aplicación móvil',
  })
  @IsString()
  @Length(AUTH_LIMITS.deviceIdMinLength, AUTH_LIMITS.deviceIdMaxLength)
  deviceId!: string;

  @ApiPropertyOptional({ example: 'Samsung Galaxy S24' })
  @IsString()
  @MaxLength(100)
  @IsOptional()
  deviceName?: string;
}
