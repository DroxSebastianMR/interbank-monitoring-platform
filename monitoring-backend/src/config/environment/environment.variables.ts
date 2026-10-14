import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, IsUrl, Min, MinLength } from 'class-validator';

import { APPLICATION_DEFAULTS } from '@/config/application/application.constants';
import {
  MINIMUM_JWT_SECRET_LENGTH,
  SUPPORTED_NODE_ENVIRONMENTS,
} from '@/config/environment/environment.constants';

export class EnvironmentVariables {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  MONITORING_PORT = APPLICATION_DEFAULTS.port;

  @IsIn(SUPPORTED_NODE_ENVIRONMENTS)
  @IsOptional()
  NODE_ENV = APPLICATION_DEFAULTS.environment;

  @IsString()
  @MinLength(1)
  DATABASE_URL!: string;

  @IsString()
  @MinLength(MINIMUM_JWT_SECRET_LENGTH)
  JWT_SECRET!: string;

  @Type(() => Number)
  @IsInt()
  @Min(60)
  @IsOptional()
  JWT_ACCESS_TTL_SECONDS = 900;

  @Type(() => Number)
  @IsInt()
  @Min(300)
  @IsOptional()
  JWT_REFRESH_TTL_SECONDS = 2_592_000;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  AUTH_MAX_FAILED_ATTEMPTS = 5;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  AUTH_LOCK_MINUTES = 15;

  @IsString()
  @IsOptional()
  REDIS_HOST = 'localhost';

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  REDIS_PORT = 6379;

  @IsUrl({ require_tld: false })
  @IsOptional()
  AI_SERVICE_URL = 'http://localhost:8000';

  @IsUrl({ require_tld: false })
  @IsOptional()
  PROMETHEUS_URL = 'http://localhost:9090';

  @IsUrl({ require_tld: false })
  @IsOptional()
  APP_BACKEND_URL = 'http://localhost:8080';

  @Type(() => Number)
  @IsInt()
  @Min(1_000)
  @IsOptional()
  MONITOR_INTERVAL_MS = 10_000;

  @Type(() => Number)
  @IsInt()
  @Min(100)
  @IsOptional()
  MONITOR_TIMEOUT_MS = 3_000;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  LATENCY_THRESHOLD_MS = 1_000;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  MAX_HEALTH_FAILURES = 3;

  @IsString()
  @IsOptional()
  CORS_ORIGINS?: string;

  @IsIn(['true', 'false'])
  @IsOptional()
  MONITORING_DOCS_ONLY = 'false';
}
