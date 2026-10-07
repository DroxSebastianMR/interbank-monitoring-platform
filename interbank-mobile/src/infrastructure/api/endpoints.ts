export const API_ENDPOINTS = {
  SYSTEM: { HEALTH: "/health" },
  AUTH: {
    LOGIN: "/auth/login",
    DEVICE_LOGIN: "/auth/device-login",
  },
  HOME: { SUMMARY: "/home" },
  ACCOUNTS: { LIST: "/accounts" },
  TRANSFERS: { CREATE: "/transfers" },
  SERVICE_PAYMENTS: {
    ROOT: "/service-payments",
    CATEGORIES: "/service-payments/categories",
    PROVIDERS: "/service-payments/providers",
    DEBT_INQUIRY: "/service-payments/debts/inquiry",
    HISTORY: "/service-payments/history",
    SAVED: "/service-payments/saved",
  },
} as const;
