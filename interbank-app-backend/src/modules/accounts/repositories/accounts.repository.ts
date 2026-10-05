import { Injectable } from '@nestjs/common';

import { PrismaService } from '@/common/prisma/prisma.service';

const ACCOUNT_SELECT = {
  id: true,
  displayName: true,
  accountNumber: true,
  balance: true,
  currency: true,
  type: true,
} as const;

@Injectable()
export class AccountsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByUser(userId: string) {
    return this.prisma.account.findMany({
      where: { userId },
      orderBy: [{ currency: 'asc' }, { createdAt: 'asc' }],
      select: ACCOUNT_SELECT,
    });
  }

  findOwnedById(userId: string, accountId: string) {
    return this.prisma.account.findFirst({
      where: { id: accountId, userId },
      select: ACCOUNT_SELECT,
    });
  }

  findTransactions(userId: string, accountId: string, limit: number) {
    return this.prisma.transaction.findMany({
      where: { accountId, account: { userId } },
      orderBy: { occurredAt: 'desc' },
      take: limit,
      select: {
        id: true,
        type: true,
        direction: true,
        status: true,
        amount: true,
        currency: true,
        description: true,
        reference: true,
        occurredAt: true,
      },
    });
  }
}
