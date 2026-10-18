import { PrismaClient } from '@prisma/client';
import { seedDemoPromotions } from './seeds/promotions.seed';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  try {
    await seedDemoPromotions(prisma);
  } finally {
    await prisma.$disconnect();
  }
}

void main().catch((error: unknown) => {
  console.error('No se pudieron crear las promociones de demostración', error);
  process.exitCode = 1;
});
