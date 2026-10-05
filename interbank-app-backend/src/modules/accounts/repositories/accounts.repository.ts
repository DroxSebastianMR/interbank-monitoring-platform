import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { ACCOUNTS_LIMITS } from '@/modules/accounts/constants/accounts.constants';
import type { ListAccountsQueryDto } from '@/modules/accounts/dto/list-accounts-query.dto';
import { ACCOUNT_SELECT } from '@/modules/accounts/types/accounts.types';

@Injectable()
export class AccountsRepository {
  constructor(private readonly prisma: PrismaService) {}
  findByUser(userId: string, query: ListAccountsQueryDto = {}) {
    return this.prisma.account.findMany({
      where: {
        userId,
        currency: query.currency,
        type: query.type,
        status: query.status,
        accountTypeId: query.accountTypeId,
      },
      orderBy: [{ currency: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }],
      take: ACCOUNTS_LIMITS.maxAccounts,
      select: ACCOUNT_SELECT,
    });
  }
  findOwnedById(userId: string, accountId: string) {
    return this.prisma.account.findFirst({
      where: { id: accountId, userId },
      select: ACCOUNT_SELECT,
    });
  }
}
