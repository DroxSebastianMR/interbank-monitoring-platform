import { Injectable } from '@nestjs/common';
import { AccountStatus, Currency, Prisma } from '@prisma/client';
import { PrismaService } from '@/common/prisma/prisma.service';
import { TRANSFER_LIMITS } from '@/modules/transfers/constants/transfers.constants';
import type { ListTransfersQueryDto } from '@/modules/transfers/dto/list-transfers-query.dto';
import { TransferDirection } from '@/modules/transfers/enums/transfer-direction.enum';
import {
  TRANSFER_DETAILS_INCLUDE,
  TRANSFER_SOURCE_SELECT,
} from '@/modules/transfers/types/transfer.types';

@Injectable()
export class TransferQueryRepository {
  constructor(private readonly prisma: PrismaService) {}
  sources(userId: string, currency?: Currency) {
    return this.prisma.account.findMany({
      where: {
        userId,
        currency,
        status: AccountStatus.ACTIVE,
        accountType: { allowsDebits: true },
      },
      select: TRANSFER_SOURCE_SELECT,
      orderBy: [{ currency: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }],
      take: TRANSFER_LIMITS.maxSourceAccounts,
    });
  }
  resolve(accountNumber: string) {
    return this.prisma.account.findUnique({
      where: { accountNumber },
      select: { ...TRANSFER_SOURCE_SELECT, user: { select: { firstName: true, lastName: true } } },
    });
  }
  ownedAccount(userId: string, accountId: string) {
    return this.prisma.account.findFirst({
      where: { id: accountId, userId },
      select: { id: true },
    });
  }
  participant(userId: string): Prisma.TransferWhereInput {
    return { OR: [{ userId }, { destinationAccount: { userId } }] };
  }
  detail(userId: string, id: string) {
    return this.prisma.transfer.findFirst({
      where: { id, ...this.participant(userId) },
      include: TRANSFER_DETAILS_INCLUDE,
    });
  }
  page(userId: string, query: ListTransfersQueryDto, position?: { id: string; createdAt: Date }) {
    const filters: Prisma.TransferWhereInput[] = [this.participant(userId)];
    if (query.direction === TransferDirection.OUTGOING) filters.push({ userId });
    if (query.direction === TransferDirection.INCOMING)
      filters.push({ destinationAccount: { userId } });
    if (query.accountId)
      filters.push({
        OR: [{ sourceAccountId: query.accountId }, { destinationAccountId: query.accountId }],
      });
    if (position)
      filters.push({
        OR: [
          { createdAt: { lt: position.createdAt } },
          { createdAt: position.createdAt, id: { lt: position.id } },
        ],
      });
    return this.prisma.transfer.findMany({
      where: {
        AND: filters,
        currency: query.currency,
        kind: query.kind,
        createdAt: {
          ...(query.from ? { gte: new Date(query.from) } : {}),
          ...(query.to ? { lte: new Date(query.to) } : {}),
        },
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: query.limit + 1,
      include: TRANSFER_DETAILS_INCLUDE,
    });
  }
}
