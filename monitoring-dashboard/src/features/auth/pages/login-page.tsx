import { Navigate } from 'react-router-dom';

import { useAuth } from '@/app/providers/auth/use-auth';
import { PATHS } from '@/app/router/constants/paths';
import { InterbankMonitorLogo } from '@/features/auth/components/interbank-monitor-logo';
import { LoginBrandPanel } from '@/features/auth/components/login-brand-panel';
import { LoginForm } from '@/features/auth/forms/login-form';

export function LoginPage() {
  const { employee, isLoading } = useAuth();
  if (isLoading) return <div className="notice">Validando sesión…</div>;
  if (employee) return <Navigate to={PATHS.DASHBOARD} replace />;

  return (
    <div className="grid min-h-svh bg-[#fbfdfb] text-[#102c1e] md:grid-cols-[minmax(0,44%)_minmax(0,56%)] lg:grid-cols-[minmax(0,51%)_minmax(0,49%)]">
      <LoginBrandPanel />
      <section className="flex min-h-svh flex-col items-center justify-center bg-[#fbfdfb] px-6 py-8 md:px-8 md:py-10" aria-label="Acceso al monitor">
        <div className="mb-16 w-full max-w-[414px] md:hidden">
          <InterbankMonitorLogo variant="dark" />
        </div>
        <LoginForm />
        <p className="mt-16 text-center text-[11px] text-[#91a197] md:mt-0">Acceso exclusivo para personal autorizado. Tu sesión está protegida.</p>
      </section>
    </div>
  );
}
