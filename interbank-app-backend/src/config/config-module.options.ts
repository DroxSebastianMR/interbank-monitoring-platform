import type { ConfigModuleOptions } from '@nestjs/config';

import appConfig from '@/config/application/app.config';
import authConfig from '@/config/authentication/auth.config';
import cacheConfig from '@/config/cache/cache.config';
import { validateEnvironment } from '@/config/environment/environment.validation';

export const configModuleOptions: ConfigModuleOptions = {
  isGlobal: true,
  cache: true,
  expandVariables: true,
  envFilePath: ['.env'],
  load: [appConfig, authConfig, cacheConfig],
  validate: validateEnvironment,
};
