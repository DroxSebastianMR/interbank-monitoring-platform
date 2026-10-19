import { TwinOrbit } from '@/components/loading-ui/twin-orbit';
import { InterbankMonitorLogo } from '@/features/auth/components/interbank-monitor-logo';

export function FullPageLoader({ label = 'Validando sesión…' }: { label?: string }) {
  return (
    <main className="full-page-loader" aria-live="polite" aria-busy="true">
      <div className="full-page-loader-card">
        <span className="full-page-loader-mark" aria-hidden="true">
          <InterbankMonitorLogo variant="dark" compact />
        </span>
        <TwinOrbit className="full-page-loader-orbit" label="Cargando" />
        <div>
          <h1>{label}</h1>
          <p>Estamos preparando el centro de monitoreo.</p>
        </div>
      </div>
    </main>
  );
}
