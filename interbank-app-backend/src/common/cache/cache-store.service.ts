import { Injectable, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

import type { CacheConfig } from '@/config';

interface MemoryCacheEntry {
  value: string;
  expiresAt: number;
}

@Injectable()
export class CacheStoreService implements OnModuleInit, OnModuleDestroy {
  private readonly memory = new Map<string, MemoryCacheEntry>();
  private readonly redis?: Redis;

  constructor(configService: ConfigService) {
    const config = configService.getOrThrow<CacheConfig>('cache');
    if (config.driver === 'redis') {
      this.redis = new Redis({
        host: config.redis.host,
        port: config.redis.port,
        password: config.redis.password,
        db: config.redis.database,
        keyPrefix: config.redis.keyPrefix,
        lazyConnect: true,
        maxRetriesPerRequest: 2,
        enableReadyCheck: true,
      });
    }
  }

  async onModuleInit(): Promise<void> {
    if (this.redis?.status === 'wait') await this.redis.connect();
  }

  async onModuleDestroy(): Promise<void> {
    if (this.redis && this.redis.status !== 'end') await this.redis.quit();
  }

  async get(key: string): Promise<string | null> {
    if (this.redis) return this.redis.get(key);
    const entry = this.memory.get(key);
    if (!entry) return null;
    if (entry.expiresAt <= Date.now()) {
      this.memory.delete(key);
      return null;
    }
    return entry.value;
  }

  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    if (this.redis) {
      await this.redis.set(key, value, 'EX', ttlSeconds);
      return;
    }
    this.memory.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
  }

  async delete(key: string): Promise<void> {
    if (this.redis) await this.redis.del(key);
    else this.memory.delete(key);
  }
}
