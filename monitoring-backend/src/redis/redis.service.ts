import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
@Injectable()
export class RedisService implements OnModuleDestroy {
  readonly client: Redis;
  constructor(config: ConfigService) {
    this.client = new Redis({
      host: config.get<string>('redis.host'),
      port: config.get<number>('redis.port'),
      lazyConnect: true,
      maxRetriesPerRequest: 1,
    });
  }
  async ping() {
    if (this.client.status === 'wait') await this.client.connect();
    return this.client.ping();
  }
  async onModuleDestroy() {
    await this.client.quit().catch(() => undefined);
  }
}
