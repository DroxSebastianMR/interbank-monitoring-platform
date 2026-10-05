import type { ServiceDebt } from '@prisma/client';

import type { ServiceDebtResponse } from '@/modules/service-payments/types/service-debt.types';
import type { ServicePaymentDetails } from '@/modules/service-payments/types/service-payment.types';
import type { SavedServicePaymentDetails } from '@/modules/service-payments/types/saved-service-payment.types';

export class ServicePaymentMapper {
  static debt(debt: ServiceDebt): ServiceDebtResponse {
    return {
      id: debt.id,
      invoiceNumber: debt.invoiceNumber,
      description: debt.description,
      amount: debt.amount.toFixed(2),
      minimumPaymentAmount: debt.minimumPaymentAmount?.toFixed(2) ?? null,
      currency: debt.currency,
      issuedAt: debt.issuedAt.toISOString(),
      dueDate: debt.dueDate.toISOString(),
      status: debt.status,
    };
  }

  static payment(payment: ServicePaymentDetails, replayed = false) {
    return {
      id: payment.id,
      operationNumber: payment.operationNumber,
      status: payment.status,
      account: {
        id: payment.accountId,
        displayName: payment.account.displayName,
        maskedNumber: this.maskAccount(payment.account.accountNumber),
      },
      provider: {
        code: payment.serviceAgreement.provider.code,
        name: payment.providerNameSnapshot,
        shortName: payment.serviceAgreement.provider.shortName,
        logoUrl: payment.serviceAgreement.provider.logoUrl,
        category: payment.serviceAgreement.provider.category.code,
      },
      service: {
        code: payment.serviceAgreement.code,
        name: payment.serviceNameSnapshot,
      },
      customerReference: payment.customerReference,
      invoiceNumber: payment.debt?.invoiceNumber ?? null,
      amount: payment.amount.toFixed(2),
      commissionAmount: payment.commissionAmount.toFixed(2),
      totalAmount: payment.totalAmount.toFixed(2),
      currency: payment.currency,
      transactionId: payment.transactionId,
      paidAt: payment.paidAt?.toISOString() ?? null,
      createdAt: payment.createdAt.toISOString(),
      replayed,
    };
  }

  static savedPayment(saved: SavedServicePaymentDetails) {
    return {
      id: saved.id,
      alias: saved.alias,
      customerReference: saved.customerReference,
      provider: {
        code: saved.serviceAgreement.provider.code,
        name: saved.serviceAgreement.provider.name,
        shortName: saved.serviceAgreement.provider.shortName,
        logoUrl: saved.serviceAgreement.provider.logoUrl,
        category: saved.serviceAgreement.provider.category.code,
      },
      service: {
        code: saved.serviceAgreement.code,
        name: saved.serviceAgreement.name,
        referenceLabel: saved.serviceAgreement.referenceLabel,
      },
      updatedAt: saved.updatedAt.toISOString(),
    };
  }

  private static maskAccount(accountNumber: string): string {
    return `•••• ${accountNumber.slice(-4)}`;
  }
}
