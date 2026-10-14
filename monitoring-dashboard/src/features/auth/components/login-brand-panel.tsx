import { InterbankMonitorLogo } from '@/features/auth/components/interbank-monitor-logo';

export function LoginBrandPanel() {
  return (
    <section
      className="hidden min-h-svh bg-[linear-gradient(135deg,#006b3b_0%,#0a995c_100%)] p-8 text-white md:flex md:flex-col lg:p-12 xl:p-16"
      aria-label="Interbank Monitor"
    >
      <InterbankMonitorLogo />
    </section>
  );
}
