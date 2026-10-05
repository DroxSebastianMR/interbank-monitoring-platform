export const APP_CONFIG_NAMESPACE = 'app';

export const APPLICATION_METADATA = {
  name: 'Simulated Interbank API',
  description:
    'API bancaria simulada para autenticación, cuentas, transferencias y pruebas controladas de disponibilidad.',
  version: '0.1.0',
} as const;

export const APPLICATION_DEFAULTS = {
  port: 3000,
  environment: 'development',
  instanceName: 'unknown',
} as const;
