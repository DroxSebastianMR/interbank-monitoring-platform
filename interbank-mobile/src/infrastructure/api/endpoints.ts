export const API_ENDPOINTS = {
  SYSTEM: { HEALTH: "/health" },
  AUTH: {
    LOGIN: "/auth/login",
    DEVICE_LOGIN: "/auth/device-login",
    BIOMETRIC_ENROLL: "/auth/biometrics/enroll",
    BIOMETRIC_LOGIN: "/auth/biometrics/login",
    BIOMETRIC_REVOKE: "/auth/biometrics/revoke",
  },
  HOME: { SUMMARY: "/home" },
  ACCOUNTS: { LIST: "/accounts" },
  TRANSFERS: {
    CREATE: "/transfers",
    SOURCES: "/transfers/sources",
    RESOLVE: "/transfers/beneficiaries/resolve",
  },
  SERVICE_PAYMENTS: {
    ROOT: "/service-payments",
    CATEGORIES: "/service-payments/categories",
    PROVIDERS: "/service-payments/providers",
    DEBT_INQUIRY: "/service-payments/debts/inquiry",
    HISTORY: "/service-payments/history",
    SAVED: "/service-payments/saved",
  },
} as const;
