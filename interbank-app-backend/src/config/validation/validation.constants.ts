import type { ValidationPipeOptions } from '@nestjs/common';

export const GLOBAL_VALIDATION_OPTIONS: ValidationPipeOptions = {
  transform: true,
  whitelist: true,
  forbidNonWhitelisted: true,
  transformOptions: { enableImplicitConversion: true },
};
