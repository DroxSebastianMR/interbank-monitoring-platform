import { Injectable } from '@nestjs/common';

import { PrismaService } from '@/common/prisma/prisma.service';
import { HOME_RECENT_TRANSACTION_LIMIT } from '@/modules/home/constants/home.constants';
import type { HomeSnapshot } from '@/modules/home/types/home.types';

@Injectable()
export class HomeRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getSnapshot(userId: string): Promise<HomeSnapshot> {
    const [user, accounts, recentTransactions] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: userId }, select: { firstName: true } }),
      this.prisma.account.findMany({
        where: { userId },
        orderBy: [{ currency: 'asc' }, { createdAt: 'asc' }],
        select: {
          id: true,
          displayName: true,
          accountNumber: true,
          balance: true,
          currency: true,
          type: true,
        },
      }),
      this.prisma.transaction.findMany({
        where: { account: { userId } },
        orderBy: { occurredAt: 'desc' },
        take: HOME_RECENT_TRANSACTION_LIMIT,
        select: {
          id: true,
          accountId: true,
          type: true,
          direction: true,
          status: true,
          amount: true,
          currency: true,
          description: true,
          occurredAt: true,
          account: { select: { displayName: true } },
        },
      }),
    ]);

    return {
      firstName: user?.firstName ?? null,
      accounts: accounts.map((account) => ({
        ...account,
        balance: account.balance.toFixed(2),
      })),
      recentTransactions: recentTransactions.map(({ account, amount, ...transaction }) => ({
        ...transaction,
        accountName: account.displayName,
        amount: amount.toFixed(2),
      })),
    };
  }
}
