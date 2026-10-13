import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

import { AUTH_LIMITS } from '@/modules/auth/constants/auth.constants';

export class ChangePasswordDto {
  @ApiProperty()
  @IsString()
  currentPassword!: string;

  @ApiProperty({ minLength: AUTH_LIMITS.passwordMinLength })
  @IsString()
  @Length(AUTH_LIMITS.passwordMinLength, AUTH_LIMITS.passwordMaxLength)
  newPassword!: string;
}
