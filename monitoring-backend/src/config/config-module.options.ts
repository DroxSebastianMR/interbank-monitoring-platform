import type { ConfigModuleOptions } from '@nestjs/config';

import appConfig from '@/config/application/app.config';
import authConfig from '@/config/authentication/auth.config';
import integrationsConfig from '@/config/integrations/integrations.config';
import monitoringConfig from '@/config/monitoring/monitoring.config';
import redisConfig from '@/config/redis/redis.config';
import rulesConfig from '@/config/rules/rules.config';
import { validateEnvironment } from '@/config/environment/environment.validation';

export const configModuleOptions: ConfigModuleOptions = {
  isGlobal: true,
  cache: true,
  expandVariables: true,
  envFilePath: ['.env'],
  load: [appConfig, authConfig, integrationsConfig, monitoringConfig, redisConfig, rulesConfig],
  validate: validateEnvironment,
};
