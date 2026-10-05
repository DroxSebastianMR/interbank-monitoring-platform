import { Injectable } from '@nestjs/common';
import { Prisma, TransactionDirection, TransactionStatus, TransactionType } from '@prisma/client';

import { PrismaService } from '@/common/prisma/prisma.service';
import { ServicePaymentFailureReason } from '@/modules/service-payments/enums/service-payment-failure-reason.enum';
import { ServicePaymentDomainError } from '@/modules/service-payments/exceptions/service-payment-domain.error';
import { ServicePaymentAmountPolicy } from '@/modules/service-payments/policies/service-payment-amount.policy';
import {
  SERVICE_PAYMENT_DETAILS_INCLUDE,
  type ExecuteServicePaymentInput,
  type ServicePaymentDetails,
} from '@/modules/service-payments/types/service-payment.types';

@Injectable()
export class ServicePaymentCommandRepository {
  constructor(private readonly prisma: PrismaService) {}

  async execute(
    userId: string,
    input: ExecuteServicePaymentInput,
  ): Promise<{ payment: ServicePaymentDetails; replayed: boolean }> {
    const existing = await this.findByIdempotency(userId, input.idempotencyKey);
    if (existing) return this.resolveIdempotentResult(existing, input.requestFingerprint);

    try {
      const payment = await this.prisma.$transaction(
        (transaction) => this.executeTransaction(transaction, userId, input),
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 8_000 },
      );
      return { payment, replayed: false };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const repeated = await this.findByIdempotency(userId, input.idempotencyKey);
        if (repeated) return this.resolveIdempotentResult(repeated, input.requestFingerprint);
      }
      throw error;
    }
  }

  private async executeTransaction(
    transaction: Prisma.TransactionClient,
    userId: string,
    input: ExecuteServicePaymentInput,
  ): Promise<ServicePaymentDetails> {
    const repeated = await transaction.servicePayment.findUnique({
      where: { userId_idempotencyKey: { userId, idempotencyKey: input.idempotencyKey } },
      include: SERVICE_PAYMENT_DETAILS_INCLUDE,
    });
    if (repeated) return this.resolveIdempotentResult(repeated, input.requestFingerprint).payment;

    const [account, agreement] = await Promise.all([
      transaction.account.findFirst({
        where: { id: input.accountId, userId },
        select: { id: true, currency: true },
      }),
      transaction.serviceAgreement.findFirst({
        where: { code: input.serviceCode, isActive: true, provider: { status: 'ACTIVE' } },
        include: { provider: true },
      }),
    ]);
    if (!account) this.fail(ServicePaymentFailureReason.ACCOUNT_NOT_FOUND);
    if (!agreement) this.fail(ServicePaymentFailureReason.SERVICE_NOT_FOUND);
    if (account.currency !== agreement.currency) {
      this.fail(ServicePaymentFailureReason.CURRENCY_MISMATCH);
    }

    const debt = input.debtId
      ? await transaction.serviceDebt.findFirst({
          where: {
            id: input.debtId,
            serviceAgreementId: agreement.id,
            customerReference: input.customerReference,
          },
        })
      : null;
    this.validateDebt(input.debtId, debt);

    const resolved = ServicePaymentAmountPolicy.resolve(agreement, debt, input.amount);
    await this.debitAccount(transaction, account.id, userId, resolved.totalAmount);
    const paidAt = new Date();
    if (debt) await this.markDebtAsPaid(transaction, debt.id, paidAt);

    return transaction.servicePayment.create({
      data: {
        user: { connect: { id: userId } },
        account: { connect: { id: account.id } },
        serviceAgreement: { connect: { id: agreement.id } },
        ...(debt ? { debt: { connect: { id: debt.id } } } : {}),
        transaction: {
          create: {
            accountId: account.id,
            type: TransactionType.SERVICE_PAYMENT,
            direction: TransactionDirection.DEBIT,
            status: TransactionStatus.COMPLETED,
            amount: resolved.totalAmount,
            currency: resolved.currency,
            description: `Pago de ${agreement.provider.shortName} - ${agreement.name}`,
            reference: input.operationNumber,
            occurredAt: paidAt,
          },
        },
        operationNumber: input.operationNumber,
        idempotencyKey: input.idempotencyKey,
        requestFingerprint: input.requestFingerprint,
        customerReference: input.customerReference,
        providerNameSnapshot: agreement.provider.name,
        serviceNameSnapshot: agreement.name,
        amount: resolved.amount,
        commissionAmount: resolved.commissionAmount,
        totalAmount: resolved.totalAmount,
        currency: resolved.currency,
        status: TransactionStatus.COMPLETED,
        paidAt,
      },
      include: SERVICE_PAYMENT_DETAILS_INCLUDE,
    });
  }

  private findByIdempotency(userId: string, idempotencyKey: string) {
    return this.prisma.servicePayment.findUnique({
      where: { userId_idempotencyKey: { userId, idempotencyKey } },
      include: SERVICE_PAYMENT_DETAILS_INCLUDE,
    });
  }

  private validateDebt(
    requestedDebtId: string | undefined,
    debt: { id: string; status: string; dueDate: Date } | null,
  ): void {
    if (requestedDebtId && !debt) this.fail(ServicePaymentFailureReason.DEBT_NOT_FOUND);
    if (debt?.status === 'PAID') this.fail(ServicePaymentFailureReason.DEBT_ALREADY_PAID);
    if (debt && (debt.status === 'EXPIRED' || debt.dueDate.getTime() < Date.now())) {
      this.fail(ServicePaymentFailureReason.DEBT_EXPIRED);
    }
    if (debt && debt.status !== 'PENDING') this.fail(ServicePaymentFailureReason.DEBT_NOT_FOUND);
  }

  private async debitAccount(
    transaction: Prisma.TransactionClient,
    accountId: string,
    userId: string,
    amount: Prisma.Decimal,
  ): Promise<void> {
    const result = await transaction.account.updateMany({
      where: { id: accountId, userId, balance: { gte: amount } },
      data: { balance: { decrement: amount } },
    });
    if (result.count !== 1) this.fail(ServicePaymentFailureReason.INSUFFICIENT_FUNDS);
  }

  private async markDebtAsPaid(
    transaction: Prisma.TransactionClient,
    debtId: string,
    paidAt: Date,
  ): Promise<void> {
    const result = await transaction.serviceDebt.updateMany({
      where: { id: debtId, status: 'PENDING' },
      data: { status: 'PAID', paidAt },
    });
    if (result.count !== 1) this.fail(ServicePaymentFailureReason.DEBT_ALREADY_PAID);
  }

  private resolveIdempotentResult(
    payment: ServicePaymentDetails,
    fingerprint: string,
  ): { payment: ServicePaymentDetails; replayed: true } {
    if (payment.requestFingerprint !== fingerprint) {
      this.fail(ServicePaymentFailureReason.IDEMPOTENCY_CONFLICT);
    }
    return { payment, replayed: true };
  }

  private fail(reason: ServicePaymentFailureReason): never {
    throw new ServicePaymentDomainError(reason);
  }
}
