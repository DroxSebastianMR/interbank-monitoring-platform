import { Type } from 'class-transformer';
import { IsIn, IsInt, IsNumber, IsOptional, IsString, Min, MinLength } from 'class-validator';

import { APPLICATION_DEFAULTS } from '@/config/application/application.constants';
import {
  MINIMUM_JWT_SECRET_LENGTH,
  SUPPORTED_NODE_ENVIRONMENTS,
} from '@/config/environment/environment.constants';

export class EnvironmentVariables {
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  APP_PORT = APPLICATION_DEFAULTS.port;

  @IsIn(SUPPORTED_NODE_ENVIRONMENTS)
  @IsOptional()
  NODE_ENV = APPLICATION_DEFAULTS.environment;

  @IsString()
  @MinLength(1)
  DATABASE_URL!: string;

  @IsString()
  @MinLength(1)
  DIRECT_URL!: string;

  @IsString()
  @MinLength(MINIMUM_JWT_SECRET_LENGTH)
  JWT_SECRET!: string;

  @IsString()
  @MinLength(MINIMUM_JWT_SECRET_LENGTH)
  @IsOptional()
  AUTH_SESSION_PEPPER?: string;

  @Type(() => Number)
  @IsInt()
  @Min(60)
  @IsOptional()
  JWT_ACCESS_TTL_SECONDS = 900;

  @Type(() => Number)
  @IsInt()
  @Min(300)
  @IsOptional()
  AUTH_SESSION_TTL_SECONDS = 2_592_000;

  @IsIn(['memory', 'redis'])
  @IsOptional()
  SESSION_CACHE_DRIVER = 'memory';

  @IsString()
  @IsOptional()
  REDIS_HOST = 'localhost';

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  REDIS_PORT = 6379;

  @IsString()
  @IsOptional()
  REDIS_PASSWORD?: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  REDIS_DATABASE = 0;

  @IsString()
  @IsOptional()
  CORS_ORIGINS?: string;
}
