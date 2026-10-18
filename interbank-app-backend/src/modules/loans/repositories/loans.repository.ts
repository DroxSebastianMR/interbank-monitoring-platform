import { Injectable } from '@nestjs/common';
import { AccountStatus, Currency, LoanApplicationStatus, Prisma } from '@prisma/client';
import { PrismaService } from '@/common/prisma/prisma.service';
import type { LoanQuote } from '@/modules/loans/policies/loan-quote.policy';

@Injectable()
export class LoansRepository {
  constructor(private readonly prisma: PrismaService) {}

  eligibleAccount(userId: string, id: string) {
    return this.prisma.account.findFirst({
      where: { id, userId, status: AccountStatus.ACTIVE, currency: Currency.PEN },
      select: { id: true },
    });
  }

  findByKey(userId: string, idempotencyKey: string) {
    return this.prisma.loanApplication.findUnique({
      where: { userId_idempotencyKey: { userId, idempotencyKey } },
    });
  }

  create(
    userId: string,
    destinationAccountId: string,
    key: string,
    fingerprint: string,
    quote: LoanQuote,
  ) {
    return this.prisma.loanApplication.create({
      data: {
        userId,
        destinationAccountId,
        idempotencyKey: key,
        requestFingerprint: fingerprint,
        principal: quote.principal,
        annualEffectiveRate: quote.annualEffectiveRate,
        monthlyPayment: quote.monthlyPayment,
        totalRepayment: quote.totalRepayment,
        months: quote.months,
      },
    });
  }

  list(userId: string) {
    return this.prisma.loanApplication.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  detail(userId: string, id: string) {
    return this.prisma.loanApplication.findFirst({ where: { id, userId } });
  }

  cancel(userId: string, id: string) {
    return this.prisma.loanApplication.updateMany({
      where: { id, userId, status: LoanApplicationStatus.PENDING_REVIEW },
      data: { status: LoanApplicationStatus.CANCELLED },
    });
  }

  isUniqueConflict(error: unknown): boolean {
    return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
  }
}
