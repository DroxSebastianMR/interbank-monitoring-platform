import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  PromotionCategory,
  PromotionRedemptionMethod,
  PromotionVoucherStatus,
} from '@prisma/client';
import { randomBytes } from 'node:crypto';
import { PromotionsRepository } from '@/modules/promotions/repositories/promotions.repository';

@Injectable()
export class PromotionsService {
  constructor(private readonly repository: PromotionsRepository) {}

  categories() {
    return Object.values(PromotionCategory);
  }

  async list(userId: string, category?: PromotionCategory, savedOnly = false) {
    const promotions = await this.repository.list(userId, category, savedOnly);
    return promotions.map((item) => this.map(item));
  }

  async detail(userId: string, id: string) {
    const promotion = await this.repository.detail(userId, id);
    if (!promotion) throw new NotFoundException('Promoción no disponible');
    return this.map(promotion);
  }

  async save(userId: string, id: string) {
    await this.detail(userId, id);
    await this.repository.save(userId, id);
    return this.detail(userId, id);
  }

  async remove(userId: string, id: string) {
    await this.repository.remove(userId, id);
  }

  async vouchers(userId: string) {
    return (await this.repository.vouchers(userId)).map((item) => this.mapVoucher(item));
  }

  async voucher(userId: string, id: string) {
    const item = await this.repository.voucher(userId, id);
    if (!item) throw new NotFoundException('Código no encontrado');
    return this.mapVoucher(item);
  }

  async claim(userId: string, promotionId: string) {
    const promotion = await this.repository.detail(userId, promotionId);
    if (!promotion) throw new NotFoundException('Promoción no disponible');
    if (promotion.redemptionMethod === PromotionRedemptionMethod.AUTOMATIC || !promotion.codePrefix)
      throw new BadRequestException('Esta promoción no requiere código');
    const code = `${promotion.codePrefix}-${randomBytes(6).toString('hex').toUpperCase()}`;
    const item = await this.repository.issueVoucher(userId, promotionId, code);
    if (!item) throw new NotFoundException('Promoción no disponible');
    return this.mapVoucher(item);
  }

  private mapVoucher(item: NonNullable<Awaited<ReturnType<PromotionsRepository['voucher']>>>) {
    return {
      id: item.id,
      promotionId: item.promotionId,
      code: item.code,
      status: item.expiresAt.getTime() <= Date.now() ? PromotionVoucherStatus.EXPIRED : item.status,
      issuedAt: item.issuedAt.toISOString(),
      expiresAt: item.expiresAt.toISOString(),
      redeemableExternally: false,
    };
  }

  private map(item: NonNullable<Awaited<ReturnType<PromotionsRepository['detail']>>>) {
    return {
      id: item.id,
      title: item.title,
      description: item.description,
      category: item.category,
      imageUrl: item.imageUrl,
      termsUrl: item.termsUrl,
      startsAt: item.startsAt.toISOString(),
      endsAt: item.endsAt.toISOString(),
      isSaved: item.favorites.length > 0,
      merchantName: item.merchant?.name ?? null,
      merchantLogoUrl: item.merchant?.logoUrl ?? null,
      redemptionMethod: item.redemptionMethod,
      hasVoucher: item.vouchers.length > 0,
    };
  }
}
