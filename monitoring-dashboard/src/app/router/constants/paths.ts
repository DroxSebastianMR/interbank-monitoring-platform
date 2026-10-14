export const PATHS = {
  LOGIN: '/login',
  DASHBOARD: '/',
  SERVICES: '/services',
  SERVICE_DETAIL: (id: string) => `/services/${encodeURIComponent(id)}`,
  INCIDENTS: '/incidents',
  ALERTS: '/alerts',
  ANALYTICS: '/analytics',
  HEALTH: '/health',
} as const;
