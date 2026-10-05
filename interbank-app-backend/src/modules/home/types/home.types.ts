export interface HomeAccountSnapshot {
  id: string;
  displayName: string;
  accountNumber: string;
  balance: string;
  currency: 'PEN' | 'USD';
  type: 'SAVINGS' | 'CHECKING';
}

export interface HomeTransactionSnapshot {
  id: string;
  accountId: string;
  accountName: string;
  type: 'DEPOSIT' | 'TRANSFER' | 'SERVICE_PAYMENT';
  direction: 'CREDIT' | 'DEBIT';
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REVERSED';
  amount: string;
  currency: 'PEN' | 'USD';
  description: string;
  occurredAt: Date;
}

export interface HomeSnapshot {
  firstName: string | null;
  accounts: HomeAccountSnapshot[];
  recentTransactions: HomeTransactionSnapshot[];
}
