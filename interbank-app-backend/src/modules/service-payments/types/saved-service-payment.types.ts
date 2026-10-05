import type { Prisma } from '@prisma/client';

export interface CreateSavedServicePaymentInput {
  customerReference: string;
  alias: string;
}

export const SAVED_SERVICE_PAYMENT_DETAILS_INCLUDE = {
  serviceAgreement: { include: { provider: { include: { category: true } } } },
} satisfies Prisma.SavedServicePaymentInclude;

export type SavedServicePaymentDetails = Prisma.SavedServicePaymentGetPayload<{
  include: typeof SAVED_SERVICE_PAYMENT_DETAILS_INCLUDE;
}>;
