import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length, MaxLength, MinLength } from 'class-validator';

import { AUTH_LIMITS } from '@/modules/auth/constants/auth.constants';

export class BiometricEnrollmentDto {
  @ApiProperty({ description: 'Sesión emitida tras el ingreso con contraseña' })
  @IsString()
  @MinLength(32)
  @MaxLength(256)
  sessionToken!: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsString()
  @Length(AUTH_LIMITS.deviceIdMinLength, AUTH_LIMITS.deviceIdMaxLength)
  deviceId!: string;

  @ApiProperty({
    description: 'Confirmación de contraseña; nunca se almacena como credencial biométrica',
  })
  @IsString()
  @Length(AUTH_LIMITS.passwordMinLength, AUTH_LIMITS.passwordMaxLength)
  password!: string;
}

export class BiometricCredentialDto {
  @ApiProperty({
    description: 'Credencial opaca para proteger con Face ID o huella en el dispositivo',
  })
  credential!: string;

  @ApiProperty({ example: 2_592_000 })
  expiresIn!: number;
}

export class BiometricLoginDto {
  @ApiProperty({ description: 'Credencial liberada por el almacenamiento biométrico local' })
  @IsString()
  @MinLength(32)
  @MaxLength(256)
  credential!: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsString()
  @Length(AUTH_LIMITS.deviceIdMinLength, AUTH_LIMITS.deviceIdMaxLength)
  deviceId!: string;
}
