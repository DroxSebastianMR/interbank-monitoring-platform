import { Injectable } from '@nestjs/common';
import {
  AccountStatus,
  Prisma,
  TransactionDirection,
  TransactionStatus,
  TransactionType,
  TransferKind,
} from '@prisma/client';
import { PrismaService } from '@/common/prisma/prisma.service';
import { TRANSFER_LIMITS } from '@/modules/transfers/constants/transfers.constants';
import { TransferPolicy } from '@/modules/transfers/policies/transfer.policy';
import { TransferDomainError } from '@/modules/transfers/exceptions/transfer-domain.error';
import { TransferFailureReason } from '@/modules/transfers/enums/transfer-failure-reason.enum';
import {
  TRANSFER_DETAILS_INCLUDE,
  TRANSFER_SOURCE_SELECT,
  type InternalTransferInput,
  type LockedTransferAccount,
  type TransferDetails,
} from '@/modules/transfers/types/transfer.types';

@Injectable()
export class TransfersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async executeInternal(
    userId: string,
    input: InternalTransferInput,
  ): Promise<{ transfer: TransferDetails; replayed: boolean }> {
    const existing = await this.findByKey(userId, input.idempotencyKey);
    if (existing) return this.replay(existing, input.requestFingerprint);
    if (input.fromAccountId === input.toAccountId)
      TransferPolicy.fail(TransferFailureReason.SAME_ACCOUNT);

    // Reject an obvious insufficient balance before opening a write transaction.
    // The authoritative check happens again after obtaining row locks.
    const source = await this.prisma.account.findFirst({
      where: { id: input.fromAccountId, userId },
      select: TRANSFER_SOURCE_SELECT,
    });
    if (!source) TransferPolicy.fail(TransferFailureReason.SOURCE_NOT_FOUND);
    if (source.status !== AccountStatus.ACTIVE || !source.accountType.allowsDebits)
      TransferPolicy.fail(TransferFailureReason.ACCOUNT_UNAVAILABLE);
    if (input.currency && input.currency !== source.currency)
      TransferPolicy.fail(TransferFailureReason.CURRENCY_MISMATCH);
    if (source.balance.lt(input.amount)) {
      const committed = await this.findByKey(userId, input.idempotencyKey);
      if (committed) return this.replay(committed, input.requestFingerprint);
      TransferPolicy.fail(TransferFailureReason.INSUFFICIENT_FUNDS);
    }

    try {
      return await this.prisma.$transaction(
        async (tx) => {
          await tx.$executeRaw`SET LOCAL lock_timeout = '1500ms'`;
          const accounts = await tx.$queryRaw<LockedTransferAccount[]>`
          SELECT a.id, a."userId", a."displayName", a."accountNumber", a.currency,
                 a.status, a.balance, p."allowsDebits"
          FROM "app"."accounts" a
          JOIN "app"."account_types" p ON p.id = a."accountTypeId"
          WHERE a.id IN (${input.fromAccountId}::uuid, ${input.toAccountId}::uuid)
          ORDER BY a.id FOR UPDATE OF a
        `;
          const repeated = await tx.transfer.findUnique({
            where: { userId_idempotencyKey: { userId, idempotencyKey: input.idempotencyKey } },
            include: TRANSFER_DETAILS_INCLUDE,
          });
          if (repeated) return this.replay(repeated, input.requestFingerprint);

          const { source: from, destination: to } = TransferPolicy.validate(
            userId,
            accounts.find((a) => a.id === input.fromAccountId),
            accounts.find((a) => a.id === input.toAccountId),
            input.amount,
            input.currency,
          );
          const debit = await tx.account.updateMany({
            where: {
              id: from.id,
              userId,
              status: AccountStatus.ACTIVE,
              accountType: { allowsDebits: true },
              balance: { gte: input.amount },
            },
            data: { balance: { decrement: input.amount } },
          });
          if (debit.count !== 1) TransferPolicy.fail(TransferFailureReason.ACCOUNT_UNAVAILABLE);
          const credit = await tx.account.updateMany({
            where: {
              id: to.id,
              status: AccountStatus.ACTIVE,
              accountType: { allowsDebits: true },
              balance: { lte: new Prisma.Decimal(TRANSFER_LIMITS.maxAmount).minus(input.amount) },
            },
            data: { balance: { increment: input.amount } },
          });
          if (credit.count !== 1) TransferPolicy.fail(TransferFailureReason.ACCOUNT_UNAVAILABLE);
          const completedAt = new Date();
          const transfer = await tx.transfer.create({
            data: {
              userId,
              sourceAccountId: from.id,
              destinationAccountId: to.id,
              amount: input.amount,
              currency: from.currency,
              status: TransactionStatus.COMPLETED,
              kind:
                from.userId === to.userId ? TransferKind.OWN_ACCOUNTS : TransferKind.THIRD_PARTY,
              idempotencyKey: input.idempotencyKey,
              requestFingerprint: input.requestFingerprint,
              operationNumber: input.operationNumber,
              description: input.description,
              completedAt,
            },
            include: TRANSFER_DETAILS_INCLUDE,
          });
          await tx.transaction.createMany({
            data: [
              {
                accountId: from.id,
                transferId: transfer.id,
                type: TransactionType.TRANSFER,
                direction: TransactionDirection.DEBIT,
                status: TransactionStatus.COMPLETED,
                amount: input.amount,
                currency: from.currency,
                description:
                  input.description ??
                  `Transferencia a cuenta terminada en ${to.accountNumber.slice(-4)}`,
                reference: input.operationNumber,
                occurredAt: completedAt,
              },
              {
                accountId: to.id,
                transferId: transfer.id,
                type: TransactionType.TRANSFER,
                direction: TransactionDirection.CREDIT,
                status: TransactionStatus.COMPLETED,
                amount: input.amount,
                currency: from.currency,
                description:
                  input.description ??
                  `Transferencia recibida de cuenta terminada en ${from.accountNumber.slice(-4)}`,
                reference: input.operationNumber,
                occurredAt: completedAt,
              },
            ],
          });
          return { transfer, replayed: false };
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
          maxWait: TRANSFER_LIMITS.transactionMaxWaitMs,
          timeout: TRANSFER_LIMITS.transactionTimeoutMs,
        },
      );
    } catch (error) {
      if (error instanceof TransferDomainError) throw error;
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          const committed = await this.findByKey(userId, input.idempotencyKey);
          if (committed) return this.replay(committed, input.requestFingerprint);
        }
        if (
          ['P2002', 'P2028', 'P2034'].includes(error.code) ||
          (error.code === 'P2010' && ['55P03', '40P01', '57014'].includes(String(error.meta?.code)))
        ) {
          TransferPolicy.fail(TransferFailureReason.TRANSFER_BUSY);
        }
      }
      throw error;
    }
  }
  private findByKey(userId: string, idempotencyKey: string) {
    return this.prisma.transfer.findUnique({
      where: { userId_idempotencyKey: { userId, idempotencyKey } },
      include: TRANSFER_DETAILS_INCLUDE,
    });
  }
  private replay(transfer: TransferDetails, fingerprint: string) {
    if (transfer.requestFingerprint !== fingerprint)
      TransferPolicy.fail(TransferFailureReason.IDEMPOTENCY_CONFLICT);
    return { transfer, replayed: true };
  }
}
