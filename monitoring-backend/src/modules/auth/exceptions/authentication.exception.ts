import { HttpException, HttpStatus, UnauthorizedException } from '@nestjs/common';

import { AuthErrorCode } from '@/modules/auth/enums/auth-error-code.enum';

export class InvalidCredentialsException extends UnauthorizedException {
  constructor() {
    super({
      statusCode: HttpStatus.UNAUTHORIZED,
      error: 'UNAUTHORIZED',
      code: AuthErrorCode.INVALID_CREDENTIALS,
      message: 'Credenciales inválidas',
    });
  }
}

export class InvalidSessionException extends UnauthorizedException {
  constructor() {
    super({
      statusCode: HttpStatus.UNAUTHORIZED,
      error: 'UNAUTHORIZED',
      code: AuthErrorCode.INVALID_SESSION,
      message: 'La sesión es inválida, fue cerrada o expiró',
    });
  }
}

export class AccountLockedException extends HttpException {
  constructor(retryAfterSeconds: number) {
    super(
      {
        statusCode: HttpStatus.LOCKED,
        error: 'LOCKED',
        code: AuthErrorCode.ACCOUNT_LOCKED,
        message: 'La cuenta está bloqueada temporalmente',
        retryAfterSeconds,
      },
      HttpStatus.LOCKED,
    );
  }
}
