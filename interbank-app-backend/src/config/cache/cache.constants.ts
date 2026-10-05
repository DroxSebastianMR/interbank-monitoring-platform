export const CACHE_CONFIG_NAMESPACE = 'cache';

export const CACHE_DEFAULTS = {
  driver: 'memory',
  redisHost: 'localhost',
  redisPort: 6379,
  redisDatabase: 0,
  redisKeyPrefix: 'interbank-app:',
} as const;
