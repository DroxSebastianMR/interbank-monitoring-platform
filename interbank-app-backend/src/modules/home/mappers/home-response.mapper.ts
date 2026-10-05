import type {
  HomeAccountDto,
  HomeBalanceSummaryDto,
  HomeResponseDto,
} from '@/modules/home/dto/home-response.dto';
import { HOME_QUICK_ACTIONS } from '@/modules/home/constants/home.constants';
import type { HomeAccountSnapshot, HomeSnapshot } from '@/modules/home/types/home.types';

export function mapHomeResponse(snapshot: HomeSnapshot): HomeResponseDto {
  return {
    ...(snapshot.firstName ? { firstName: snapshot.firstName } : {}),
    balances: buildBalanceSummaries(snapshot.accounts),
    accounts: snapshot.accounts.map(mapAccount),
    quickActions: HOME_QUICK_ACTIONS.map((action) => ({ ...action })),
    recentTransactions: snapshot.recentTransactions.map((transaction) => ({
      ...transaction,
      occurredAt: transaction.occurredAt.toISOString(),
    })),
  };
}

function buildBalanceSummaries(accounts: HomeAccountSnapshot[]): HomeBalanceSummaryDto[] {
  return (['PEN', 'USD'] as const).map((currency) => ({
    currency,
    availableBalance: accounts
      .filter((account) => account.currency === currency)
      .reduce((total, account) => total + Number(account.balance), 0)
      .toFixed(2),
  }));
}

function mapAccount(account: HomeAccountSnapshot): HomeAccountDto {
  return {
    id: account.id,
    displayName: account.displayName,
    maskedAccountNumber: maskAccountNumber(account.accountNumber),
    availableBalance: account.balance,
    currency: account.currency,
    type: account.type,
  };
}

function maskAccountNumber(accountNumber: string): string {
  return `${'*'.repeat(Math.max(0, accountNumber.length - 4))}${accountNumber.slice(-4)}`;
}
