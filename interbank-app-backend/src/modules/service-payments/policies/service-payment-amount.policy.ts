import { Prisma } from '@prisma/client';

import { ServicePaymentFailureReason } from '@/modules/service-payments/enums/service-payment-failure-reason.enum';
import { ServicePaymentDomainError } from '@/modules/service-payments/exceptions/service-payment-domain.error';
import type { ResolvedPaymentAmount } from '@/modules/service-payments/types/service-payment.types';

export class ServicePaymentAmountPolicy {
  static resolve(
    agreement: {
      supportsDebtInquiry: boolean;
      supportsPartialPayment: boolean;
      currency: ResolvedPaymentAmount['currency'];
      commissionAmount: Prisma.Decimal;
      minimumAmount: Prisma.Decimal | null;
      maximumAmount: Prisma.Decimal | null;
    },
    debt: { amount: Prisma.Decimal; minimumPaymentAmount: Prisma.Decimal | null } | null,
    requestedAmount?: number,
  ): ResolvedPaymentAmount {
    if (agreement.supportsDebtInquiry && !debt) {
      throw new ServicePaymentDomainError(ServicePaymentFailureReason.DEBT_NOT_FOUND);
    }
    if (!debt && requestedAmount === undefined) {
      throw new ServicePaymentDomainError(ServicePaymentFailureReason.PAYMENT_AMOUNT_REQUIRED);
    }

    const amount = new Prisma.Decimal(requestedAmount ?? debt?.amount ?? 0);
    this.validateLimits(agreement, debt, amount);
    return {
      amount,
      commissionAmount: agreement.commissionAmount,
      totalAmount: amount.plus(agreement.commissionAmount),
      currency: agreement.currency,
    };
  }

  private static validateLimits(
    agreement: {
      supportsPartialPayment: boolean;
      minimumAmount: Prisma.Decimal | null;
      maximumAmount: Prisma.Decimal | null;
    },
    debt: { amount: Prisma.Decimal; minimumPaymentAmount: Prisma.Decimal | null } | null,
    amount: Prisma.Decimal,
  ): void {
    const invalid =
      (debt !== null && !agreement.supportsPartialPayment && !amount.equals(debt.amount)) ||
      (debt?.minimumPaymentAmount !== null &&
        debt?.minimumPaymentAmount !== undefined &&
        amount.lessThan(debt.minimumPaymentAmount)) ||
      (agreement.minimumAmount !== null && amount.lessThan(agreement.minimumAmount)) ||
      (agreement.maximumAmount !== null && amount.greaterThan(agreement.maximumAmount));
    if (invalid) {
      throw new ServicePaymentDomainError(ServicePaymentFailureReason.INVALID_PAYMENT_AMOUNT);
    }
  }
}
