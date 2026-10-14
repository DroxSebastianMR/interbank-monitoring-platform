import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { configModuleOptions } from '@/config';
import { PrismaModule } from '@/common/prisma/prisma.module';
import { RedisModule } from '@/redis/redis.module';
import { QueuesModule } from '@/queues/queues.module';
import { FEATURE_MODULES } from '@/modules';

@Module({
  imports: [
    ConfigModule.forRoot(configModuleOptions),
    PrismaModule,
    RedisModule,
    QueuesModule,
    ...FEATURE_MODULES,
  ],
})
export class AppModule {}
