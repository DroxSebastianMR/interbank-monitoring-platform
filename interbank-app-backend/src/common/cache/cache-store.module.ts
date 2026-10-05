import { Global, Module } from '@nestjs/common';

import { CacheStoreService } from '@/common/cache/cache-store.service';

@Global()
@Module({ providers: [CacheStoreService], exports: [CacheStoreService] })
export class CacheStoreModule {}
