export type { AppConfig, NodeEnvironment } from '@/config/application/app-config.interface';
export type { AuthConfig } from '@/config/authentication/auth-config.interface';
export { configModuleOptions } from '@/config/config-module.options';
export { buildCorsOptions, parseCorsOrigins } from '@/config/cors/cors.config';
export { setupSwagger } from '@/config/swagger/swagger.config';
export { SWAGGER_PATHS } from '@/config/swagger/swagger.constants';
export { createValidationPipe } from '@/config/validation/validation.config';
