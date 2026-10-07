import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Length, MaxLength } from 'class-validator';

import { AUTH_LIMITS } from '@/modules/auth/constants/auth.constants';

export class LoginDto {
  @ApiProperty({ example: 'ingeniero@interbank.example' })
  @IsEmail()
  @MaxLength(254)
  corporateEmail!: string;

  @ApiProperty({ example: 'UnaClaveCorporativaSegura!', minLength: 12 })
  @IsString()
  @Length(AUTH_LIMITS.passwordMinLength, AUTH_LIMITS.passwordMaxLength)
  password!: string;
}
