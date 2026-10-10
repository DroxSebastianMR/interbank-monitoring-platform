import { plainToInstance, Type } from 'class-transformer';
import {
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Min,
  MinLength,
  validateSync,
} from 'class-validator';
class Env {
  @Type(() => Number) @IsNumber() @Min(1) @IsOptional() MONITORING_PORT = 4000;
  @IsString() @MinLength(1) DATABASE_URL!: string;
  @IsString() @MinLength(32) JWT_SECRET!: string;
  @Type(() => Number) @IsNumber() @Min(60) JWT_ACCESS_TTL_SECONDS = 900;
  @Type(() => Number) @IsNumber() @Min(300) JWT_REFRESH_TTL_SECONDS = 2_592_000;
  @Type(() => Number) @IsNumber() @Min(1) AUTH_MAX_FAILED_ATTEMPTS = 5;
  @Type(() => Number) @IsNumber() @Min(1) AUTH_LOCK_MINUTES = 15;
  @IsString() REDIS_HOST!: string;
  @Type(() => Number) @IsNumber() @Min(1) REDIS_PORT!: number;
  @IsUrl({ require_tld: false }) AI_SERVICE_URL!: string;
  @IsUrl({ require_tld: false }) @IsOptional() PROMETHEUS_URL?: string;
  @IsUrl({ require_tld: false }) APP_BACKEND_URL!: string;
  @IsString() @IsOptional() CORS_ORIGINS?: string;
}
export function validate(config: Record<string, unknown>) {
  const env = plainToInstance(Env, config, { enableImplicitConversion: true });
  const errors = validateSync(env, { skipMissingProperties: false });
  if (errors.length)
    throw new Error(
      `Invalid environment: ${errors.map((e) => Object.values(e.constraints ?? {}).join(', ')).join('; ')}`,
    );
  return env;
}
