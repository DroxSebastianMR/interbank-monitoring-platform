import { Prisma } from '@prisma/client';

export const ACCOUNT_TYPE_SELECT = {
  id: true,
  code: true,
  name: true,
  description: true,
  type: true,
  supportedCurrencies: true,
  allowsDebits: true,
  isActive: true,
} satisfies Prisma.AccountTypeDefinitionSelect;
export const CARD_TYPE_SELECT = {
  id: true,
  code: true,
  name: true,
  description: true,
  kind: true,
  network: true,
} satisfies Prisma.CardTypeSelect;
export const CARD_SELECT = {
  id: true,
  displayName: true,
  lastFour: true,
  kind: true,
  status: true,
  format: true,
  expiresAt: true,
  cardType: { select: CARD_TYPE_SELECT },
  creditBalances: {
    orderBy: { currency: 'asc' as const },
    select: { currency: true, creditLimit: true, outstandingBalance: true },
  },
} satisfies Prisma.CardSelect;
export const ACCOUNT_SELECT = {
  id: true,
  displayName: true,
  accountNumber: true,
  cci: true,
  balance: true,
  currency: true,
  type: true,
  status: true,
  createdAt: true,
  closedAt: true,
  accountType: { select: ACCOUNT_TYPE_SELECT },
} satisfies Prisma.AccountSelect;
export const TRANSACTION_SELECT = {
  id: true,
  type: true,
  direction: true,
  status: true,
  amount: true,
  currency: true,
  description: true,
  reference: true,
  occurredAt: true,
} satisfies Prisma.TransactionSelect;
export type AccountSnapshot = Prisma.AccountGetPayload<{ select: typeof ACCOUNT_SELECT }>;
export type CardSnapshot = Prisma.CardGetPayload<{ select: typeof CARD_SELECT }>;
export type TransactionSnapshot = Prisma.TransactionGetPayload<{
  select: typeof TRANSACTION_SELECT;
}>;
export type TransactionPosition = { id: string; occurredAt: Date };
