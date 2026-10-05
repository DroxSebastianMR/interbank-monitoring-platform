import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length, MaxLength, MinLength } from 'class-validator';

import { AUTH_LIMITS } from '@/modules/auth/constants/auth.constants';

export class DeviceLoginDto {
  @ApiProperty({ description: 'Token opaco guardado en el almacenamiento seguro del dispositivo' })
  @IsString()
  @MinLength(32)
  @MaxLength(256)
  sessionToken!: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Debe coincidir con el dispositivo registrado en el primer ingreso',
  })
  @IsString()
  @Length(AUTH_LIMITS.deviceIdMinLength, AUTH_LIMITS.deviceIdMaxLength)
  deviceId!: string;

  @ApiProperty({ example: 'DemoSecure123!' })
  @IsString()
  @Length(AUTH_LIMITS.passwordMinLength, AUTH_LIMITS.passwordMaxLength)
  password!: string;
}
