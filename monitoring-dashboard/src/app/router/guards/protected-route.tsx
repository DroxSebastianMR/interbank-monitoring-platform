import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { useAuth } from '@/app/providers/auth/use-auth';
import { PATHS } from '@/app/router/constants/paths';

export function ProtectedRoute() {
  const { employee, isLoading } = useAuth();
  const location = useLocation();
  if (isLoading) return <div className="notice" role="status">Validando sesión…</div>;
  return employee ? <Outlet /> : <Navigate to={PATHS.LOGIN} replace state={{ from: location.pathname }} />;
}
