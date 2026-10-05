import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';

import { ServicePaymentFailureReason } from '@/modules/service-payments/enums/service-payment-failure-reason.enum';
import { ServicePaymentDomainError } from '@/modules/service-payments/exceptions/service-payment-domain.error';

const FAILURE_MESSAGES: Record<ServicePaymentFailureReason, string> = {
  ACCOUNT_NOT_FOUND: 'Cuenta de cargo no encontrada',
  ACCOUNT_UNAVAILABLE: 'La cuenta de cargo no admite pagos de servicios',
  SERVICE_NOT_FOUND: 'Servicio de pago no encontrado',
  SERVICE_UNAVAILABLE: 'El servicio de pago no está disponible',
  INVALID_CUSTOMER_REFERENCE: 'Código de identificación inválido',
  DEBT_NOT_FOUND: 'Recibo pendiente no encontrado',
  DEBT_ALREADY_PAID: 'El recibo ya fue pagado',
  DEBT_EXPIRED: 'El recibo está vencido y no admite pago',
  PAYMENT_AMOUNT_REQUIRED: 'Debe indicar el monto del pago',
  INVALID_PAYMENT_AMOUNT: 'El monto no cumple las reglas del servicio',
  CURRENCY_MISMATCH: 'La moneda de la cuenta no coincide con la del servicio',
  INSUFFICIENT_FUNDS: 'Saldo insuficiente',
  IDEMPOTENCY_CONFLICT: 'La clave de idempotencia ya fue usada con otros datos',
  SAVED_PAYMENT_NOT_FOUND: 'Pago frecuente no encontrado',
};

const NOT_FOUND_REASONS = new Set<ServicePaymentFailureReason>([
  ServicePaymentFailureReason.ACCOUNT_NOT_FOUND,
  ServicePaymentFailureReason.SERVICE_NOT_FOUND,
  ServicePaymentFailureReason.DEBT_NOT_FOUND,
  ServicePaymentFailureReason.SAVED_PAYMENT_NOT_FOUND,
]);

const CONFLICT_REASONS = new Set<ServicePaymentFailureReason>([
  ServicePaymentFailureReason.DEBT_ALREADY_PAID,
  ServicePaymentFailureReason.IDEMPOTENCY_CONFLICT,
]);

export class ServicePaymentExceptionFactory {
  static rethrow(error: unknown): never {
    if (!(error instanceof ServicePaymentDomainError)) throw error;

    const response = { code: error.reason, message: FAILURE_MESSAGES[error.reason] };
    if (NOT_FOUND_REASONS.has(error.reason)) throw new NotFoundException(response);
    if (CONFLICT_REASONS.has(error.reason)) throw new ConflictException(response);
    throw new BadRequestException(response);
  }
}
