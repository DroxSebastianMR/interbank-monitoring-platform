export const APP_CONFIG_NAMESPACE = 'app';

export const APPLICATION_METADATA = {
  name: 'Monitoring Platform API',
  description:
    'API operacional para supervisión de servicios, estados, incidentes, alertas e integración con IA.',
  version: '0.1.0',
} as const;

export const APPLICATION_DEFAULTS = {
  port: 4000,
  environment: 'development',
} as const;
