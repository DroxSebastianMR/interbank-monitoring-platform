import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { ACCOUNT_TYPE_SELECT, CARD_TYPE_SELECT } from '@/modules/accounts/types/accounts.types';

@Injectable()
export class AccountCatalogRepository {
  constructor(private readonly prisma: PrismaService) {}
  accountTypes() {
    return this.prisma.accountTypeDefinition.findMany({
      where: { isActive: true },
      orderBy: [{ displayOrder: 'asc' }, { code: 'asc' }],
      select: ACCOUNT_TYPE_SELECT,
    });
  }
  cardTypes() {
    return this.prisma.cardType.findMany({
      where: { isActive: true },
      orderBy: [{ displayOrder: 'asc' }, { code: 'asc' }],
      select: CARD_TYPE_SELECT,
    });
  }
}
