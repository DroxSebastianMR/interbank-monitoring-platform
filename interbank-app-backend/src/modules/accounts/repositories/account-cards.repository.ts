import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { ACCOUNTS_LIMITS } from '@/modules/accounts/constants/accounts.constants';
import type { ListCardsQueryDto } from '@/modules/accounts/dto/list-cards-query.dto';
import { CARD_SELECT } from '@/modules/accounts/types/accounts.types';

@Injectable()
export class AccountCardsRepository {
  constructor(private readonly prisma: PrismaService) {}
  findByUser(userId: string, query: ListCardsQueryDto = {}, accountId?: string) {
    return this.prisma.card.findMany({
      where: {
        userId,
        kind: query.kind,
        status: query.status,
        ...(accountId ? { accountLinks: { some: { accountId, userId } } } : {}),
      },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      take: ACCOUNTS_LIMITS.maxCards,
      select: CARD_SELECT,
    });
  }
  findOwnedById(userId: string, cardId: string) {
    return this.prisma.card.findFirst({ where: { id: cardId, userId }, select: CARD_SELECT });
  }
}
