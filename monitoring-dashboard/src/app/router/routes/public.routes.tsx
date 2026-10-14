import type { RouteObject } from 'react-router-dom';
import { PATHS } from '@/app/router/constants/paths';

export const publicRoutes: RouteObject[] = [
  { path: PATHS.LOGIN, lazy: async () => ({
    Component: (await import('@/features/auth/pages/login-page')).LoginPage,
  }) },
];
