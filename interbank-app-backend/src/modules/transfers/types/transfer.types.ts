export enum TransferFailureReason {
  SOURCE_NOT_FOUND = 'SOURCE_NOT_FOUND',
  DESTINATION_NOT_FOUND = 'DESTINATION_NOT_FOUND',
  SAME_ACCOUNT = 'SAME_ACCOUNT',
  CURRENCY_MISMATCH = 'CURRENCY_MISMATCH',
  INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',
}

export class TransferDomainError extends Error {
  constructor(readonly reason: TransferFailureReason) {
    super(reason);
  }
}

export interface InternalTransferInput {
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  description?: string;
}
