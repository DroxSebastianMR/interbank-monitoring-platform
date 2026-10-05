import { Injectable } from '@nestjs/common';
import { AccountStatus } from '@prisma/client';

import { PrismaService } from '@/common/prisma/prisma.service';
import {
  TransferDomainError,
  TransferFailureReason,
  type InternalTransferInput,
} from '@/modules/transfers/types/transfer.types';

@Injectable()
export class TransfersRepository {
  constructor(private readonly prisma: PrismaService) {}

  executeInternal(userId: string, input: InternalTransferInput) {
    return this.prisma.$transaction(async (transaction) => {
      if (input.fromAccountId === input.toAccountId) {
        throw new TransferDomainError(TransferFailureReason.SAME_ACCOUNT);
      }

      const [source, destination] = await Promise.all([
        transaction.account.findFirst({
          where: { id: input.fromAccountId, userId },
          select: {
            id: true,
            currency: true,
            status: true,
            accountType: { select: { allowsDebits: true } },
          },
        }),
        transaction.account.findUnique({
          where: { id: input.toAccountId },
          select: {
            id: true,
            displayName: true,
            currency: true,
            status: true,
            accountType: { select: { allowsDebits: true } },
          },
        }),
      ]);

      if (!source) throw new TransferDomainError(TransferFailureReason.SOURCE_NOT_FOUND);
      if (!destination) {
        throw new TransferDomainError(TransferFailureReason.DESTINATION_NOT_FOUND);
      }
      if (
        source.status !== AccountStatus.ACTIVE ||
        destination.status !== AccountStatus.ACTIVE ||
        !source.accountType.allowsDebits ||
        !destination.accountType.allowsDebits
      ) {
        throw new TransferDomainError(TransferFailureReason.ACCOUNT_UNAVAILABLE);
      }
      if (source.currency !== destination.currency) {
        throw new TransferDomainError(TransferFailureReason.CURRENCY_MISMATCH);
      }

      const debit = await transaction.account.updateMany({
        where: {
          id: source.id,
          userId,
          status: AccountStatus.ACTIVE,
          accountType: { allowsDebits: true },
          balance: { gte: input.amount },
        },
        data: { balance: { decrement: input.amount } },
      });
      if (debit.count !== 1) {
        throw new TransferDomainError(TransferFailureReason.INSUFFICIENT_FUNDS);
      }

      const credit = await transaction.account.updateMany({
        where: {
          id: destination.id,
          status: AccountStatus.ACTIVE,
          accountType: { allowsDebits: true },
        },
        data: { balance: { increment: input.amount } },
      });
      if (credit.count !== 1)
        throw new TransferDomainError(TransferFailureReason.ACCOUNT_UNAVAILABLE);

      const completedAt = new Date();
      const transfer = await transaction.transfer.create({
        data: {
          sourceAccountId: source.id,
          destinationAccountId: destination.id,
          amount: input.amount,
          currency: source.currency,
          status: 'COMPLETED',
          ...(input.description ? { description: input.description } : {}),
          completedAt,
        },
      });

      const description = input.description ?? `Transferencia a ${destination.displayName}`;
      await transaction.transaction.createMany({
        data: [
          {
            accountId: source.id,
            transferId: transfer.id,
            type: 'TRANSFER',
            direction: 'DEBIT',
            status: 'COMPLETED',
            amount: input.amount,
            currency: source.currency,
            description,
            reference: transfer.id,
            occurredAt: completedAt,
          },
          {
            accountId: destination.id,
            transferId: transfer.id,
            type: 'TRANSFER',
            direction: 'CREDIT',
            status: 'COMPLETED',
            amount: input.amount,
            currency: source.currency,
            description: input.description ?? 'Transferencia recibida',
            reference: transfer.id,
            occurredAt: completedAt,
          },
        ],
      });

      return transfer;
    });
  }
}
