import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AccountErrorCode } from '@/modules/accounts/enums/account-error-code.enum';

const MESSAGES: Record<AccountErrorCode, string> = {
  ACCOUNT_NOT_FOUND: 'Cuenta no encontrada',
  CARD_NOT_FOUND: 'Tarjeta no encontrada',
  INVALID_TRANSACTION_CURSOR: 'Cursor de movimientos inválido para esta cuenta',
  INVALID_DATE_RANGE: 'La fecha inicial debe ser anterior o igual a la fecha final',
};

export class AccountExceptionFactory {
  static notFound(
    code: AccountErrorCode.ACCOUNT_NOT_FOUND | AccountErrorCode.CARD_NOT_FOUND,
  ): never {
    throw new NotFoundException({ code, message: MESSAGES[code] });
  }
  static badRequest(
    code: AccountErrorCode.INVALID_TRANSACTION_CURSOR | AccountErrorCode.INVALID_DATE_RANGE,
  ): never {
    throw new BadRequestException({ code, message: MESSAGES[code] });
  }
}
