export const API_ENDPOINTS = {
  AUTH: { LOGIN: '/auth/login', REFRESH: '/auth/refresh', LOGOUT: '/auth/logout', ME: '/auth/me' },
  DASHBOARD: { OVERVIEW: '/dashboard/overview', METRICS: '/dashboard/metrics', ACTIVITY: '/dashboard/activity', TOPOLOGY: '/dashboard/topology' },
  SERVICES: {
    LIST: '/monitored-services',
    DETAIL: (id: string) => `/monitored-services/${encodeURIComponent(id)}`,
    CHECKS: (id: string) => `/monitored-services/${encodeURIComponent(id)}/checks`,
    STATE_HISTORY: (id: string) => `/monitored-services/${encodeURIComponent(id)}/state-history`,
    CONFIG_HISTORY: (id: string) => `/monitored-services/${encodeURIComponent(id)}/config-history`,
    INSTANCES: (id: string) => `/monitored-services/${encodeURIComponent(id)}/instances`,
    PAUSE: (id: string) => `/monitored-services/${encodeURIComponent(id)}/pause`,
    RESUME: (id: string) => `/monitored-services/${encodeURIComponent(id)}/resume`,
    CHECK: (id: string) => `/monitoring/${encodeURIComponent(id)}/check`,
  },
  HEALTH: '/health',
  ASSISTANT: {
    CONVERSATIONS: '/assistant/conversations',
    CONVERSATION: (id: string) => `/assistant/conversations/${encodeURIComponent(id)}`,
    MESSAGES: (id: string) => `/assistant/conversations/${encodeURIComponent(id)}/messages`,
    FEEDBACK: (id: string) => `/assistant/messages/${encodeURIComponent(id)}/feedback`,
    CAPABILITIES: '/assistant/capabilities',
  },
} as const;
