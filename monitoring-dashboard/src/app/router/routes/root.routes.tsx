import { Navigate, type RouteObject } from 'react-router-dom';
import { PATHS } from '@/app/router/constants/paths';
import { protectedRoutes } from '@/app/router/routes/protected.routes';
import { publicRoutes } from '@/app/router/routes/public.routes';

export const rootRoutes: RouteObject[] = [
  ...publicRoutes,
  ...protectedRoutes,
  { path: '*', element: <Navigate to={PATHS.DASHBOARD} replace /> },
];
