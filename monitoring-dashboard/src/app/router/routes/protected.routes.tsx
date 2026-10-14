import type { RouteObject } from 'react-router-dom';

import { ProtectedRoute } from '@/app/router/guards/protected-route';
import { PATHS } from '@/app/router/constants/paths';
import { OperationsLayout } from '@/layouts/operations/operations-layout';
import { PlaceholderPage } from '@/shared/components/placeholder-page';

export const protectedRoutes: RouteObject[] = [
  { element: <ProtectedRoute />, children: [
    { element: <OperationsLayout />, children: [
      { path: PATHS.DASHBOARD, lazy: async () => ({
        Component: (await import('@/features/dashboard/pages/dashboard-page')).DashboardPage,
      }) },
      { path: PATHS.SERVICES, lazy: async () => ({
        Component: (await import('@/features/services/pages/services-page')).ServicesPage,
      }) },
      { path: '/services/:id', lazy: async () => ({
        Component: (await import('@/features/services/pages/service-detail-page')).ServiceDetailPage,
      }) },
      { path: PATHS.INCIDENTS, element: <PlaceholderPage title="Incidentes" /> },
      { path: PATHS.ALERTS, element: <PlaceholderPage title="Alertas" /> },
      { path: PATHS.ANALYTICS, element: <PlaceholderPage title="Analítica" /> },
      { path: PATHS.HEALTH, lazy: async () => ({
        Component: (await import('@/features/health/pages/health-page')).HealthPage,
      }) },
    ] },
  ] },
];
