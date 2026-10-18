import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from '@/app.module';

const expected = [
  '/profile',
  '/profile/phone/challenge',
  '/profile/phone/verify',
  '/profile/details',
  '/profile/addresses',
  '/profile/addresses/{id}',
  '/plin/enrollment',
  '/plin/sources',
  '/plin/networks',
  '/plin/favorites',
  '/plin/favorites/{phoneNumber}',
  '/plin/recents',
  '/plin/recipients/resolve',
  '/plin/payments',
  '/plin/payments/{id}',
  '/loans/offers',
  '/loans/quote',
  '/loans/applications',
  '/loans/applications/{id}',
  '/loans/applications/{id}/schedule',
  '/loans/applications/{id}/cancel',
  '/promotions/categories',
  '/promotions/saved',
  '/promotions',
  '/promotions/{id}',
  '/promotions/{id}/save',
  '/promotions/vouchers',
  '/promotions/vouchers/{id}',
  '/promotions/{id}/vouchers',
];

async function main(): Promise<void> {
  const app = await NestFactory.create(AppModule, { logger: ['error'] });
  try {
    await app.init();
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder().setTitle('Banking API').build(),
    );
    const missing = expected.filter((path) => !document.paths[path]);
    if (missing.length) throw new Error(`Faltan rutas en OpenAPI: ${missing.join(', ')}`);
    console.log(`OpenAPI: ${expected.length} rutas nuevas verificadas`);
  } finally {
    await app.close();
  }
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
