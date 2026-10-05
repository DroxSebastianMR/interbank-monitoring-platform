import { AccountStatus, CardStatus, Prisma } from '@prisma/client';
import type {
  AccountResponseDto,
  AccountIdentifiersResponseDto,
  CardResponseDto,
  AccountTransactionResponseDto,
} from '@/modules/accounts/dto/account-response.dto';
import type {
  AccountSnapshot,
  CardSnapshot,
  TransactionSnapshot,
} from '@/modules/accounts/types/accounts.types';

export class AccountsMapper {
  static account(account: AccountSnapshot): AccountResponseDto {
    return {
      id: account.id,
      displayName: account.displayName,
      accountNumber: this.mask(account.accountNumber),
      balance: account.balance.toFixed(2),
      currency: account.currency,
      type: account.type,
      status: account.status,
      accountType: account.accountType,
      createdAt: account.createdAt.toISOString(),
      closedAt: account.closedAt?.toISOString() ?? null,
      canDebit: account.status === AccountStatus.ACTIVE && account.accountType.allowsDebits,
    };
  }
  static identifiers(account: AccountSnapshot): AccountIdentifiersResponseDto {
    return {
      accountId: account.id,
      accountNumber: account.accountNumber,
      cci: account.cci,
      currency: account.currency,
      isSimulated: true,
    };
  }
  static card(card: CardSnapshot, now = new Date()): CardResponseDto {
    return {
      id: card.id,
      displayName: card.displayName,
      maskedCardNumber: `**** **** **** ${card.lastFour}`,
      kind: card.kind,
      status: card.status,
      format: card.format,
      cardType: card.cardType,
      expiresAt: card.expiresAt.toISOString().slice(0, 10),
      isUsable:
        card.status === CardStatus.ACTIVE &&
        card.expiresAt.toISOString().slice(0, 10) >= now.toISOString().slice(0, 10),
      creditBalances: card.creditBalances.map((balance) => ({
        currency: balance.currency,
        creditLimit: balance.creditLimit.toFixed(2),
        outstandingBalance: balance.outstandingBalance.toFixed(2),
        availableCredit: Prisma.Decimal.max(
          balance.creditLimit.minus(balance.outstandingBalance),
          0,
        ).toFixed(2),
      })),
    };
  }
  static transaction(transaction: TransactionSnapshot): AccountTransactionResponseDto {
    return {
      ...transaction,
      amount: transaction.amount.toFixed(2),
      occurredAt: transaction.occurredAt.toISOString(),
    };
  }
  private static mask(value: string): string {
    return `${'*'.repeat(Math.max(0, value.length - 4))}${value.slice(-4)}`;
  }
}
