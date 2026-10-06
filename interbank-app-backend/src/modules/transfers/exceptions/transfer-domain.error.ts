import { TransferFailureReason } from '@/modules/transfers/enums/transfer-failure-reason.enum';

export class TransferDomainError extends Error {
  constructor(readonly reason: TransferFailureReason) {
    super(reason);
  }
}
