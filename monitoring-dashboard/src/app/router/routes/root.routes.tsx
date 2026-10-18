import type { RouteObject } from 'react-router-dom';
import { protectedRoutes } from '@/app/router/routes/protected.routes';
import { publicRoutes } from '@/app/router/routes/public.routes';

export const rootRoutes: RouteObject[] = [
  ...publicRoutes,
  ...protectedRoutes,
  { path: '*', lazy: async () => ({
    Component: (await import('@/features/errors/pages/error-pages')).NotFoundPage,
  }) },
];
