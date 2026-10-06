import { createHash } from 'node:crypto';
import { AccountStatus, Currency, Prisma } from '@prisma/client';
import { TRANSFER_LIMITS } from '@/modules/transfers/constants/transfers.constants';
import type { CreateTransferDto } from '@/modules/transfers/dto/create-transfer.dto';
import { TransferFailureReason } from '@/modules/transfers/enums/transfer-failure-reason.enum';
import { TransferDomainError } from '@/modules/transfers/exceptions/transfer-domain.error';
import type { LockedTransferAccount } from '@/modules/transfers/types/transfer.types';

export class TransferPolicy {
  static amount(value: number): Prisma.Decimal {
    if (!Number.isFinite(value)) this.fail(TransferFailureReason.INVALID_AMOUNT);
    const amount = new Prisma.Decimal(value.toString());
    if (amount.lte(0) || amount.decimalPlaces() > 2 || amount.gt(TRANSFER_LIMITS.maxAmount))
      this.fail(TransferFailureReason.INVALID_AMOUNT);
    return amount;
  }
  static key(value?: string): string {
    if (!value || !/^[A-Za-z0-9_-]{8,80}$/.test(value))
      this.fail(TransferFailureReason.INVALID_IDEMPOTENCY_KEY);
    return value;
  }
  static fingerprint(dto: CreateTransferDto, amount: Prisma.Decimal): string {
    return createHash('sha256')
      .update(
        JSON.stringify({
          from: dto.fromAccountId.toLowerCase(),
          to: dto.toAccountId.toLowerCase(),
          amount: amount.toFixed(2),
          currency: dto.currency ?? null,
          description: dto.description?.trim() || null,
        }),
      )
      .digest('hex');
  }
  static validate(
    userId: string,
    source: LockedTransferAccount | undefined,
    destination: LockedTransferAccount | undefined,
    amount: Prisma.Decimal,
    currency?: Currency,
  ): { source: LockedTransferAccount; destination: LockedTransferAccount } {
    if (!source || source.userId !== userId) this.fail(TransferFailureReason.SOURCE_NOT_FOUND);
    if (!destination) this.fail(TransferFailureReason.DESTINATION_NOT_FOUND);
    if (source.id === destination.id) this.fail(TransferFailureReason.SAME_ACCOUNT);
    if (
      source.status !== AccountStatus.ACTIVE ||
      destination.status !== AccountStatus.ACTIVE ||
      !source.allowsDebits ||
      !destination.allowsDebits
    )
      this.fail(TransferFailureReason.ACCOUNT_UNAVAILABLE);
    if (source.currency !== destination.currency || (currency && currency !== source.currency))
      this.fail(TransferFailureReason.CURRENCY_MISMATCH);
    if (source.balance.lt(amount)) this.fail(TransferFailureReason.INSUFFICIENT_FUNDS);
    if (destination.balance.plus(amount).gt(TRANSFER_LIMITS.maxAmount))
      this.fail(TransferFailureReason.DESTINATION_LIMIT_EXCEEDED);
    return { source, destination };
  }
  static fail(reason: TransferFailureReason): never {
    throw new TransferDomainError(reason);
  }
}
