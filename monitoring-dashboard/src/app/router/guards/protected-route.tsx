import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { useAuth } from '@/app/providers/auth/use-auth';
import { PATHS } from '@/app/router/constants/paths';
import { FullPageLoader } from '@/shared/components/loading/full-page-loader';

export function ProtectedRoute() {
  const { employee, isLoading } = useAuth();
  const location = useLocation();
  if (isLoading) return <FullPageLoader />;
  return employee ? <Outlet /> : <Navigate to={PATHS.LOGIN} replace state={{ from: location.pathname }} />;
}
