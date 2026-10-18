import { Registry, collectDefaultMetrics } from '@prometheus-io/client';

export const httpMetricsRegistry = new Registry();
collectDefaultMetrics({ register: httpMetricsRegistry, prefix: 'interbank_app_' });
