import { registerAs } from '@nestjs/config';

import {
  APP_CONFIG_NAMESPACE,
  APPLICATION_DEFAULTS,
  APPLICATION_METADATA,
} from '@/config/application/application.constants';
import type { AppConfig, NodeEnvironment } from '@/config/application/app-config.interface';
import { parseCorsOrigins } from '@/config/cors/cors.config';

export default registerAs(APP_CONFIG_NAMESPACE, (): AppConfig => ({
  ...APPLICATION_METADATA,
  port: Number(process.env.APP_PORT ?? APPLICATION_DEFAULTS.port),
  env: (process.env.NODE_ENV ?? APPLICATION_DEFAULTS.environment) as NodeEnvironment,
  simulationEnabled: process.env.SIMULATION_ENABLED === 'true',
  instanceName: process.env.INSTANCE_NAME ?? APPLICATION_DEFAULTS.instanceName,
  corsOrigins: parseCorsOrigins(process.env.CORS_ORIGINS),
}));
