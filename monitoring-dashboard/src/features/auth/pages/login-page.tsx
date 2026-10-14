import { Navigate } from 'react-router-dom';

import { useAuth } from '@/app/providers/auth/use-auth';
import { PATHS } from '@/app/router/constants/paths';
import { LoginForm } from '@/features/auth/forms/login-form';

export function LoginPage() {
  const { employee, isLoading } = useAuth();
  if (isLoading) return <div className="notice">Validando sesión…</div>;
  if (employee) return <Navigate to={PATHS.DASHBOARD} replace />;

  return (
    <div className="login">
      <LoginForm />
    </div>
  );
}
