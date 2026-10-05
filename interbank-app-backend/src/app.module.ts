import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { CacheStoreModule } from '@/common/cache/cache-store.module';
import { PrismaModule } from '@/common/prisma/prisma.module';
import { configModuleOptions } from '@/config';
import { FEATURE_MODULES } from '@/modules';

@Module({
  imports: [
    ConfigModule.forRoot(configModuleOptions),
    CacheStoreModule,
    PrismaModule,
    ...FEATURE_MODULES,
  ],
})
export class AppModule {}
