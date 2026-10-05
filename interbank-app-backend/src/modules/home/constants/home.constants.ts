export const HOME_RECENT_TRANSACTION_LIMIT = 10;
export const HOME_CACHE_TTL_SECONDS = 15;
export const HOME_CACHE_PREFIX = 'home:user:';

export const HOME_QUICK_ACTIONS = [
  { code: 'TRANSFER', label: 'Transferir', path: '/transfers' },
  { code: 'SERVICE_PAYMENT', label: 'Pagar servicios', path: '/service-payments' },
] as const;
