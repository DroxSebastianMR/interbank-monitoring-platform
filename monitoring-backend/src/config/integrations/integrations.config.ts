import { registerAs } from '@nestjs/config';

export interface IntegrationsConfig {
  aiServiceUrl: string;
  prometheusUrl: string;
  appBackendUrl: string;
}

export default registerAs('integrations', (): IntegrationsConfig => ({
  aiServiceUrl: process.env.AI_SERVICE_URL ?? 'http://localhost:8000',
  prometheusUrl: process.env.PROMETHEUS_URL ?? 'http://localhost:9090',
  appBackendUrl: process.env.APP_BACKEND_URL ?? 'http://localhost:8080',
}));
