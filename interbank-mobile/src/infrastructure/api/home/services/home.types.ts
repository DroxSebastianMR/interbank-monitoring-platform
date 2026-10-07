export type Currency = "PEN" | "USD";

export interface HomeBalance {
  currency: Currency;
  availableBalance: string;
}

export interface HomeAccount {
  id: string;
  displayName: string;
  maskedAccountNumber: string;
  availableBalance: string;
  currency: Currency;
  type: "SAVINGS" | "CHECKING";
}

export interface HomeQuickAction {
  code: string;
  label: string;
  path: string;
  badge?: string;
}

export interface HomeTransaction {
  id: string;
  accountId: string;
  accountName: string;
  type: "DEPOSIT" | "TRANSFER" | "SERVICE_PAYMENT";
  direction: "CREDIT" | "DEBIT";
  status: "PENDING" | "COMPLETED" | "FAILED" | "REVERSED";
  amount: string;
  currency: Currency;
  description: string;
  occurredAt: string;
}

export interface HomeResponse {
  firstName?: string;
  balances: HomeBalance[];
  accounts: HomeAccount[];
  quickActions: HomeQuickAction[];
  recentTransactions: HomeTransaction[];
}
