export type SessionCacheDriver = 'memory' | 'redis';

export interface CacheConfig {
  driver: SessionCacheDriver;
  redis: {
    host: string;
    port: number;
    password?: string;
    database: number;
    keyPrefix: string;
  };
}
