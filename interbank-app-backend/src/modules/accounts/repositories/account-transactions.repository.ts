import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/common/prisma/prisma.service';
import type { ListTransactionsQueryDto } from '@/modules/accounts/dto/list-transactions-query.dto';
import {
  TRANSACTION_SELECT,
  type TransactionPosition,
} from '@/modules/accounts/types/accounts.types';

@Injectable()
export class AccountTransactionsRepository {
  constructor(private readonly prisma: PrismaService) {}
  findPosition(userId: string, accountId: string, id: string) {
    return this.prisma.transaction.findFirst({
      where: { id, accountId, account: { userId } },
      select: { id: true, occurredAt: true },
    });
  }
  findPage(
    userId: string,
    accountId: string,
    query: ListTransactionsQueryDto,
    position?: TransactionPosition,
  ) {
    const where: Prisma.TransactionWhereInput = {
      accountId,
      account: { userId },
      type: query.type,
      direction: query.direction,
      status: query.status,
      occurredAt: {
        ...(query.from ? { gte: new Date(query.from) } : {}),
        ...(query.to ? { lte: new Date(query.to) } : {}),
      },
      ...(position
        ? {
            OR: [
              { occurredAt: { lt: position.occurredAt } },
              { occurredAt: position.occurredAt, id: { lt: position.id } },
            ],
          }
        : {}),
    };
    return this.prisma.transaction.findMany({
      where,
      orderBy: [{ occurredAt: 'desc' }, { id: 'desc' }],
      take: query.limit + 1,
      select: TRANSACTION_SELECT,
    });
  }
}
