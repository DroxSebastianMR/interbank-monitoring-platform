import { registerAs } from '@nestjs/config';

import type { CacheConfig, SessionCacheDriver } from '@/config/cache/cache-config.interface';
import { CACHE_CONFIG_NAMESPACE, CACHE_DEFAULTS } from '@/config/cache/cache.constants';

export default registerAs(CACHE_CONFIG_NAMESPACE, (): CacheConfig => ({
  driver: (process.env.SESSION_CACHE_DRIVER ?? CACHE_DEFAULTS.driver) as SessionCacheDriver,
  redis: {
    host: process.env.REDIS_HOST ?? CACHE_DEFAULTS.redisHost,
    port: Number(process.env.REDIS_PORT ?? CACHE_DEFAULTS.redisPort),
    password: process.env.REDIS_PASSWORD || undefined,
    database: Number(process.env.REDIS_DATABASE ?? CACHE_DEFAULTS.redisDatabase),
    keyPrefix: process.env.REDIS_KEY_PREFIX ?? CACHE_DEFAULTS.redisKeyPrefix,
  },
}));
