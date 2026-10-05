import type { Currency, Prisma } from '@prisma/client';

export interface ExecuteServicePaymentInput {
  accountId: string;
  serviceCode: string;
  customerReference: string;
  debtId?: string;
  amount?: number;
  idempotencyKey: string;
  requestFingerprint: string;
  operationNumber: string;
}

export const SERVICE_PAYMENT_DETAILS_INCLUDE = {
  serviceAgreement: {
    include: {
      provider: { include: { category: true } },
    },
  },
  debt: true,
  transaction: true,
  account: { select: { displayName: true, accountNumber: true } },
} satisfies Prisma.ServicePaymentInclude;

export type ServicePaymentDetails = Prisma.ServicePaymentGetPayload<{
  include: typeof SERVICE_PAYMENT_DETAILS_INCLUDE;
}>;

export interface ResolvedPaymentAmount {
  amount: Prisma.Decimal;
  commissionAmount: Prisma.Decimal;
  totalAmount: Prisma.Decimal;
  currency: Currency;
}
