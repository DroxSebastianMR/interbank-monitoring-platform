import { AccountStatus, Currency, Prisma } from '@prisma/client';
export { TransferFailureReason } from '@/modules/transfers/enums/transfer-failure-reason.enum';
export { TransferDomainError } from '@/modules/transfers/exceptions/transfer-domain.error';

export interface InternalTransferInput {
  fromAccountId: string;
  toAccountId: string;
  amount: Prisma.Decimal;
  currency?: Currency;
  description?: string;
  idempotencyKey: string;
  requestFingerprint: string;
  operationNumber: string;
}

export const TRANSFER_ACCOUNT_SELECT = {
  id: true,
  userId: true,
  displayName: true,
  accountNumber: true,
  currency: true,
} satisfies Prisma.AccountSelect;
export const TRANSFER_DETAILS_INCLUDE = {
  sourceAccount: { select: TRANSFER_ACCOUNT_SELECT },
  destinationAccount: { select: TRANSFER_ACCOUNT_SELECT },
} satisfies Prisma.TransferInclude;
export type TransferDetails = Prisma.TransferGetPayload<{
  include: typeof TRANSFER_DETAILS_INCLUDE;
}>;
export const TRANSFER_SOURCE_SELECT = {
  ...TRANSFER_ACCOUNT_SELECT,
  balance: true,
  status: true,
  accountType: { select: { name: true, allowsDebits: true } },
} satisfies Prisma.AccountSelect;
export type TransferAccount = Prisma.AccountGetPayload<{ select: typeof TRANSFER_SOURCE_SELECT }>;
export interface LockedTransferAccount {
  id: string;
  userId: string;
  displayName: string;
  accountNumber: string;
  currency: Currency;
  status: AccountStatus;
  balance: Prisma.Decimal;
  allowsDebits: boolean;
}
