import { Injectable } from '@nestjs/common';

import { CacheStoreService } from '@/common/cache/cache-store.service';
import { HOME_CACHE_PREFIX, HOME_CACHE_TTL_SECONDS } from '@/modules/home/constants/home.constants';
import type { HomeResponseDto } from '@/modules/home/dto/home-response.dto';

@Injectable()
export class HomeCacheService {
  constructor(private readonly cache: CacheStoreService) {}

  async find(userId: string): Promise<HomeResponseDto | null> {
    const cached = await this.cache.get(this.key(userId));
    return cached ? (JSON.parse(cached) as HomeResponseDto) : null;
  }

  async set(userId: string, response: HomeResponseDto): Promise<void> {
    await this.cache.set(this.key(userId), JSON.stringify(response), HOME_CACHE_TTL_SECONDS);
  }

  invalidate(userId: string): Promise<void> {
    return this.cache.delete(this.key(userId));
  }

  private key(userId: string): string {
    return `${HOME_CACHE_PREFIX}${userId}`;
  }
}
