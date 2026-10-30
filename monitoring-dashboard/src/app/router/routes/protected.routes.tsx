import type { RouteObject } from 'react-router-dom';

import { ProtectedRoute } from '@/app/router/guards/protected-route';
import { PATHS } from '@/app/router/constants/paths';
import { OperationsLayout } from '@/layouts/operations/operations-layout';

export const protectedRoutes: RouteObject[] = [
  { element: <ProtectedRoute />, children: [
    { element: <OperationsLayout />, children: [
      { path: PATHS.DASHBOARD, lazy: async () => ({
        Component: (await import('@/features/dashboard/pages/dashboard-page')).DashboardPage,
      }) },
      { path: PATHS.SERVICES, lazy: async () => ({
        Component: (await import('@/features/services/pages/services-page')).ServicesPage,
      }) },
      { path: PATHS.ENDPOINTS, lazy: async () => ({
        Component: (await import('@/features/endpoints/pages/endpoints-page')).EndpointsPage,
      }) },
      { path: '/services/:id', lazy: async () => ({
        Component: (await import('@/features/services/pages/service-detail-page')).ServiceDetailPage,
      }) },
      { path: PATHS.INCIDENTS, lazy: async () => ({ Component: (await import('@/features/incidents/pages/incidents-page')).IncidentsPage }) },
      { path: '/incidents/:id', lazy: async () => ({ Component: (await import('@/features/incidents/pages/incident-detail-page')).IncidentDetailPage }) },
      { path: PATHS.ALERTS, lazy: async () => ({ Component: (await import('@/features/alerts/pages/alerts-page')).AlertsPage }) },
      { path: PATHS.ANALYTICS, lazy: async () => ({ Component: (await import('@/features/analytics/pages/analytics-page')).AnalyticsPage }) },
      { path: PATHS.HEALTH, lazy: async () => ({
        Component: (await import('@/features/health/pages/health-page')).HealthPage,
      }) },
      { path: PATHS.ASSISTANT, lazy: async () => ({
        Component: (await import('@/features/assistant/pages/assistant-page')).AssistantPage,
      }) },
    ] },
  ] },
];
