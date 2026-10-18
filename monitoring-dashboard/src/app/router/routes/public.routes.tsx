import type { RouteObject } from 'react-router-dom';
import { PATHS } from '@/app/router/constants/paths';

export const publicRoutes: RouteObject[] = [
  { path: PATHS.LOGIN, lazy: async () => ({
    Component: (await import('@/features/auth/pages/login-page')).LoginPage,
  }) },
  { path: PATHS.FORBIDDEN, lazy: async () => ({
    Component: (await import('@/features/errors/pages/error-pages')).ForbiddenPage,
  }) },
  { path: PATHS.NOT_FOUND, lazy: async () => ({
    Component: (await import('@/features/errors/pages/error-pages')).NotFoundPage,
  }) },
  { path: PATHS.SERVER_ERROR, lazy: async () => ({
    Component: (await import('@/features/errors/pages/error-pages')).ServerErrorPage,
  }) },
];
