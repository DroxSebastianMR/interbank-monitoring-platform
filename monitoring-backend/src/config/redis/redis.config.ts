import { registerAs } from '@nestjs/config';

export interface RedisConfig {
  host: string;
  port: number;
}

export default registerAs('redis', (): RedisConfig => ({
  host: process.env.REDIS_HOST ?? 'localhost',
  port: Number(process.env.REDIS_PORT ?? 6379),
}));
