import { Injectable } from '@nestjs/common';
import { PromotionCategory, PromotionRedemptionMethod } from '@prisma/client';
import { PrismaService } from '@/common/prisma/prisma.service';

@Injectable()
export class PromotionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  list(userId: string, category?: PromotionCategory, savedOnly = false) {
    const now = new Date();
    return this.prisma.promotion.findMany({
      where: {
        isActive: true,
        startsAt: { lte: now },
        endsAt: { gt: now },
        ...(category ? { category } : {}),
        ...(savedOnly ? { favorites: { some: { userId } } } : {}),
      },
      include: {
        favorites: { where: { userId }, select: { userId: true } },
        vouchers: { where: { userId }, select: { id: true } },
        merchant: { select: { name: true, logoUrl: true } },
      },
      orderBy: [{ priority: 'desc' }, { endsAt: 'asc' }, { id: 'asc' }],
      take: 100,
    });
  }

  detail(userId: string, id: string) {
    const now = new Date();
    return this.prisma.promotion.findFirst({
      where: { id, isActive: true, startsAt: { lte: now }, endsAt: { gt: now } },
      include: {
        favorites: { where: { userId }, select: { userId: true } },
        vouchers: { where: { userId }, select: { id: true } },
        merchant: { select: { name: true, logoUrl: true } },
      },
    });
  }

  save(userId: string, promotionId: string) {
    return this.prisma.promotionFavorite.upsert({
      where: { userId_promotionId: { userId, promotionId } },
      create: { userId, promotionId },
      update: {},
    });
  }

  remove(userId: string, promotionId: string) {
    return this.prisma.promotionFavorite.deleteMany({ where: { userId, promotionId } });
  }

  vouchers(userId: string) {
    return this.prisma.promotionVoucher.findMany({
      where: { userId },
      orderBy: [{ issuedAt: 'desc' }, { id: 'asc' }],
      take: 100,
    });
  }

  voucher(userId: string, id: string) {
    return this.prisma.promotionVoucher.findFirst({ where: { id, userId } });
  }

  async issueVoucher(userId: string, promotionId: string, code: string) {
    return this.prisma.$transaction(async (tx) => {
      const promotion = await tx.promotion.findFirst({
        where: {
          id: promotionId,
          isActive: true,
          startsAt: { lte: new Date() },
          endsAt: { gt: new Date() },
        },
      });
      if (!promotion) return null;
      if (
        !promotion.codePrefix ||
        promotion.redemptionMethod === PromotionRedemptionMethod.AUTOMATIC
      )
        return null;
      return tx.promotionVoucher.upsert({
        where: { promotionId_userId: { promotionId, userId } },
        create: { promotionId, userId, code, expiresAt: promotion.endsAt },
        update: {},
      });
    });
  }
}
