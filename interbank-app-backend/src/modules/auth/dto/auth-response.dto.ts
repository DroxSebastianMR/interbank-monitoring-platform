import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { AuthLoginMode } from '@/modules/auth/enums/auth-login-mode.enum';

export class AuthTokenDto {
  @ApiProperty() accessToken!: string;
  @ApiProperty({ example: 'Bearer' }) tokenType!: 'Bearer';
  @ApiProperty({ example: 900 }) expiresIn!: number;
}

export class AuthSessionDto {
  @ApiProperty() sessionToken!: string;
  @ApiProperty({ example: 2_592_000 }) expiresIn!: number;
  @ApiProperty() deviceId!: string;
}

export class AuthenticatedUserDto {
  @ApiProperty() id!: string;
  @ApiProperty({ example: '****5678' }) documentNumber!: string;
  @ApiProperty({ example: 'c***@interbank.test' }) email!: string;
  @ApiPropertyOptional() firstName?: string;
  @ApiPropertyOptional() lastName?: string;
}

export class AuthResponseDto {
  @ApiProperty({ example: true }) authenticated!: true;
  @ApiProperty({ enum: AuthLoginMode })
  loginMode!: AuthLoginMode;
  @ApiProperty({ type: AuthTokenDto }) token!: AuthTokenDto;
  @ApiProperty({ type: AuthSessionDto }) session!: AuthSessionDto;
  @ApiProperty({ type: AuthenticatedUserDto }) user!: AuthenticatedUserDto;
}
