import { motion, useReducedMotion } from 'motion/react';
import { Navigate } from 'react-router-dom';

import { useAuth } from '@/app/providers/auth/use-auth';
import { PATHS } from '@/app/router/constants/paths';
import { InterbankMonitorLogo } from '@/features/auth/components/interbank-monitor-logo';
import { LoginBrandPanel } from '@/features/auth/components/login-brand-panel';
import { LoginForm } from '@/features/auth/forms/login-form';
import { FullPageLoader } from '@/shared/components/loading/full-page-loader';

export function LoginPage() {
  const { employee, isLoading } = useAuth();
  const reduceMotion = useReducedMotion();

  if (isLoading) return <FullPageLoader />;
  if (employee) return <Navigate to={PATHS.DASHBOARD} replace />;

  return (
    <main className="grid min-h-[100dvh] overflow-hidden bg-[#f8fbf8] text-[#102c1e] lg:grid-cols-[minmax(0,53%)_minmax(0,47%)]">
      <LoginBrandPanel />
      <section className="relative flex min-h-[100dvh] flex-col overflow-hidden px-6 py-7 sm:px-10 lg:px-[clamp(3rem,7vw,8.5rem)]" aria-label="Acceso al monitor">
        <div className="pointer-events-none absolute -top-28 -right-24 size-80 rounded-full bg-[#b3f3cf]/35 blur-3xl" />
        <div className="pointer-events-none absolute right-0 bottom-0 left-0 h-48 bg-[linear-gradient(180deg,transparent,#e8f8ed80)]" />
        <motion.header className="relative z-10 lg:hidden" initial={reduceMotion ? false : { opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
          <InterbankMonitorLogo variant="dark" compact />
        </motion.header>
        <div className="relative z-10 flex flex-1 items-center justify-center py-10 lg:py-14"><div className="w-full lg:scale-90 lg:transform-gpu"><LoginForm /></div></div>
      </section>
    </main>
  );
}
