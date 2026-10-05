import { HttpStatus, UnauthorizedException } from '@nestjs/common';

import { INVALID_CREDENTIALS_MESSAGE } from '@/modules/auth/constants/auth.constants';
import { AuthErrorCode } from '@/modules/auth/enums/auth-error-code.enum';
import type { LoginFailureReason } from '@/modules/auth/enums/login-failure-reason.enum';

export class AuthenticationException extends UnauthorizedException {
  constructor(readonly reason: LoginFailureReason) {
    super({
      statusCode: HttpStatus.UNAUTHORIZED,
      error: 'UNAUTHORIZED',
      code: AuthErrorCode.INVALID_CREDENTIALS,
      message: INVALID_CREDENTIALS_MESSAGE,
    });
  }
}
