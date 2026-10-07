export const HOME_RECENT_TRANSACTION_LIMIT = 10;
export const HOME_CACHE_TTL_SECONDS = 15;
export const HOME_CACHE_PREFIX = 'home:user:';
export const HOME_NEW_CARD_WINDOW_DAYS = 30;

export const HOME_QUICK_ACTIONS = [
  { code: 'PLINEAR', label: 'Plinear', path: '/plinear' },
  { code: 'TRANSFER', label: 'Transferir', path: '/transfers' },
  { code: 'SERVICE_PAYMENT', label: 'Pagar servicios', path: '/service-payments' },
  { code: 'MOBILE_TOP_UP', label: 'Recargar celular', path: '/mobile-top-up' },
  { code: 'EXCHANGE', label: 'Cambiar moneda', path: '/exchange' },
  { code: 'CARD', label: 'Ver tarjeta', path: '/accounts/cards' },
  { code: 'ADD_PRODUCT', label: 'Agregar producto', path: '/accounts/products' },
  { code: 'ALL', label: 'Ver todo', path: '/operations' },
] as const;
