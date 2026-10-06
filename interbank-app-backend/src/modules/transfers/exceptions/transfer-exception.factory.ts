import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { TransferFailureReason } from '@/modules/transfers/enums/transfer-failure-reason.enum';
import { TransferDomainError } from '@/modules/transfers/exceptions/transfer-domain.error';

const MESSAGES: Record<TransferFailureReason, string> = {
  SOURCE_NOT_FOUND: 'Cuenta de origen no encontrada',
  DESTINATION_NOT_FOUND: 'Cuenta de destino no encontrada o no disponible',
  SAME_ACCOUNT: 'La cuenta de origen y destino deben ser diferentes',
  CURRENCY_MISMATCH: 'Las cuentas y la solicitud deben utilizar la misma moneda',
  INSUFFICIENT_FUNDS: 'Saldo insuficiente',
  ACCOUNT_UNAVAILABLE: 'La cuenta no admite esta operación',
  DESTINATION_LIMIT_EXCEEDED: 'La cuenta de destino no puede recibir este monto',
  INVALID_AMOUNT:
    'El monto debe ser positivo, con máximo dos decimales y dentro del límite permitido',
  INVALID_IDEMPOTENCY_KEY:
    'Idempotency-Key debe tener entre 8 y 80 caracteres alfanuméricos, guiones o guiones bajos',
  IDEMPOTENCY_CONFLICT: 'La clave de idempotencia ya fue utilizada con otros datos',
  TRANSFER_NOT_FOUND: 'Transferencia no encontrada',
  INVALID_TRANSFER_CURSOR: 'Cursor de transferencias inválido',
  INVALID_TRANSFER_DATE_RANGE: 'La fecha inicial debe ser anterior o igual a la final',
  TRANSFER_BUSY: 'La operación está ocupada; reintenta con la misma clave de idempotencia',
};
const NOT_FOUND = new Set([
  TransferFailureReason.SOURCE_NOT_FOUND,
  TransferFailureReason.DESTINATION_NOT_FOUND,
  TransferFailureReason.TRANSFER_NOT_FOUND,
]);
export class TransferExceptionFactory {
  static rethrow(error: unknown): never {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      ['P1001', 'P1002', 'P2024', 'P2028'].includes(error.code)
    ) {
      throw new ServiceUnavailableException({
        code: TransferFailureReason.TRANSFER_BUSY,
        message: MESSAGES[TransferFailureReason.TRANSFER_BUSY],
      });
    }
    if (!(error instanceof TransferDomainError)) throw error;
    const body = { code: error.reason, message: MESSAGES[error.reason] };
    if (NOT_FOUND.has(error.reason)) throw new NotFoundException(body);
    if (error.reason === TransferFailureReason.IDEMPOTENCY_CONFLICT)
      throw new ConflictException(body);
    if (error.reason === TransferFailureReason.TRANSFER_BUSY)
      throw new ServiceUnavailableException(body);
    throw new BadRequestException(body);
  }
}
