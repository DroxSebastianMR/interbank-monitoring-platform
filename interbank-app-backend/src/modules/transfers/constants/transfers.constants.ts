export const TRANSFER_LIMITS = {
  maxAmount: '999999999999.99',
  keyMinLength: 8,
  keyMaxLength: 80,
  defaultPageSize: 20,
  maxPageSize: 50,
  maxSourceAccounts: 100,
  transactionTimeoutMs: 5000,
  transactionMaxWaitMs: 2000,
} as const;
