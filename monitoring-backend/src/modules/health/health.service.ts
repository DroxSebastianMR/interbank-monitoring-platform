import { Injectable } from '@nestjs/common';
import { RedisService } from '../../redis/redis.service';
@Injectable()
export class HealthService {
  constructor(private readonly redis: RedisService) {}
  async check() {
    let redis = 'down';
    try {
      redis = await this.redis.ping();
    } catch {
      redis = 'down';
    }
    return {
      status: redis === 'PONG' ? 'ok' : 'degraded',
      service: 'monitoring-backend',
      dependencies: { redis },
      timestamp: new Date().toISOString(),
    };
  }
}
