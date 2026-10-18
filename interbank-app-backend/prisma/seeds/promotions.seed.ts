import { PrismaClient, PromotionCategory, PromotionRedemptionMethod } from '@prisma/client';

const DEMO_PROMOTIONS = [
  {
    id: '60000000-0000-4000-8000-000000000001',
    title: 'Cine de demostración',
    description:
      'Beneficio ficticio para probar el carrusel. No canjeable en establecimientos reales.',
    category: PromotionCategory.ENTERTAINMENT,
    priority: 20,
    merchantName: 'Cine de demostración',
    redemptionMethod: PromotionRedemptionMethod.ONLINE_CODE,
    codePrefix: 'DEMOCINE',
  },
  {
    id: '60000000-0000-4000-8000-000000000002',
    title: 'Restaurante de demostración',
    description:
      'Promoción de prueba para visualizar campañas. No representa una oferta comercial real.',
    category: PromotionCategory.DINING,
    priority: 10,
    merchantName: 'Restaurante de demostración',
    redemptionMethod: PromotionRedemptionMethod.SHOW_CODE,
    codePrefix: 'DEMOFOOD',
  },
] as const;

export async function seedDemoPromotions(prisma: PrismaClient): Promise<void> {
  for (const promotion of DEMO_PROMOTIONS) {
    const merchant = await prisma.promotionMerchant.upsert({
      where: { name: promotion.merchantName },
      create: { name: promotion.merchantName },
      update: {},
    });
    await prisma.promotion.upsert({
      where: { id: promotion.id },
      create: {
        id: promotion.id,
        title: promotion.title,
        description: promotion.description,
        category: promotion.category,
        priority: promotion.priority,
        merchantId: merchant.id,
        redemptionMethod: promotion.redemptionMethod,
        codePrefix: promotion.codePrefix,
        startsAt: new Date('2026-01-01T00:00:00Z'),
        endsAt: new Date('2030-01-01T00:00:00Z'),
      },
      update: {
        merchantId: merchant.id,
        redemptionMethod: promotion.redemptionMethod,
        codePrefix: promotion.codePrefix,
      },
    });
  }
}
