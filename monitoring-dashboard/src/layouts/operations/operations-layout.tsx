import {
  Activity,
  BellRing,
  Bot,
  ChartNoAxesCombined,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  MonitorCog,
  Route,
  Server,
  Siren,
  UserRound,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from '@/app/providers/auth/use-auth';
import { PermissionCode } from '@/features/auth/enums/permission-code.enum';
import { PATHS } from '@/app/router/constants/paths';
import { Button } from '@/components/ui/button';
import { InterbankMonitorLogo } from '@/features/auth/components/interbank-monitor-logo';
import { ModuleBackButton } from '@/shared/components/module-back-button';
import { ModuleHeaderContext } from '@/layouts/operations/module-header-context';
import { formatShortDate, formatTime } from '@/shared/utils/format';
import { useOperationalRealtime } from '@/features/realtime/hooks/use-operational-realtime';

const monitoringLinks = [
  { to: PATHS.SERVICES, label: 'Servicios', icon: Server, count: 3, tone: 'info' },
  { to: PATHS.INCIDENTS, label: 'Incidentes', icon: Siren, count: 3, tone: 'critical' },
  { to: PATHS.ALERTS, label: 'Alertas', icon: BellRing, count: 2, tone: 'warning' },
];

const intelligenceLinks = [
  { to: PATHS.ANALYTICS, label: 'Analítica', icon: ChartNoAxesCombined, count: 0, tone: 'info' },
  { to: PATHS.HEALTH, label: 'Health', icon: Activity, count: 0, tone: 'info' },
  { to: PATHS.ASSISTANT, label: 'Asistente IA', icon: Bot, count: 1, tone: 'success' },
];

const pageTitles: Array<[string, string]> = [
  [PATHS.ENDPOINTS, 'Endpoints por instancia'],
  [PATHS.SERVICES, 'Servicios digitales'],
  [PATHS.INCIDENTS, 'Incidentes'],
  [PATHS.ALERTS, 'Alertas'],
  [PATHS.ANALYTICS, 'Analítica'],
  [PATHS.HEALTH, 'Salud del monitor'],
  [PATHS.ASSISTANT, 'Asistente operativo'],
];

export function OperationsLayout() {
  const { employee, signOut } = useAuth();
  const realtimeStatus = useOperationalRealtime(employee?.id, employee?.permissions.join(',') ?? '');
  const navigate = useNavigate();
  const location = useLocation();
  const [monitoringOpen, setMonitoringOpen] = useState(true);
  const [intelligenceOpen, setIntelligenceOpen] = useState(true);
  const [moduleChild, setModuleChild] = useState<string | null>(null);
  const [moduleActions, setModuleActions] = useState<ReactNode>(null);
  const moduleHeader = useMemo(() => ({ setModuleChild, setModuleActions }), []);
  const moduleName = pageTitles.find(([path]) => path !== '/' && location.pathname.startsWith(path))?.[1] ?? 'Resumen operativo';
  const onServiceDetail = location.pathname.startsWith(`${PATHS.SERVICES}/`);
  const overviewContext = new URLSearchParams(location.search);
  const cameFromOverview = onServiceDetail && overviewContext.get('from') === 'overview';
  overviewContext.delete('from');
  overviewContext.delete('stateReference');
  const overviewReturnTo = `${PATHS.DASHBOARD}${overviewContext.size ? `?${overviewContext.toString()}` : ''}`;
  const displayName = [employee?.firstName, employee?.lastName].filter(Boolean).join(' ') || 'operador';
  const now = new Date();

  return (
    <ModuleHeaderContext.Provider value={moduleHeader}>
      <div className="operations-shell">
      <aside className="operations-sidebar">
        <div className="operations-brand">
          <span className="brand-mark"><InterbankMonitorLogo variant="dark" compact /></span>
          <span className="brand-wordmark" aria-hidden="true">
            <strong>Interbank</strong>
            <span>Monitoring</span>
          </span>
        </div>
        <nav className="operations-nav" aria-label="Navegación principal">
          <NavLink className="nav-primary" to={PATHS.DASHBOARD} end>
            <LayoutDashboard aria-hidden="true" /><span>Vista general</span>
          </NavLink>
          <section className={`nav-group ${monitoringOpen ? 'is-open' : ''}`}>
            <button type="button" className="nav-group-trigger" aria-expanded={monitoringOpen} aria-controls="monitoring-links" onClick={() => setMonitoringOpen((open) => !open)}>
              <MonitorCog aria-hidden="true" /><span>Monitoreo</span><ChevronDown className="nav-chevron" aria-hidden="true" />
            </button>
            <div className="nav-group-list" id="monitoring-links">
              {employee?.permissions.includes(PermissionCode.ANALYTICS_READ) && <NavLink to={PATHS.ENDPOINTS}><Route aria-hidden="true" /><span>Endpoints</span></NavLink>}
              {monitoringLinks.map(({ to, label, icon: Icon, count, tone }) => (
                <NavLink key={to} to={to}><Icon aria-hidden="true" /><span>{label}</span>{count > 0 && <span className={`nav-count tone-${tone}`} aria-label={`${count} notificaciones`}>{count}</span>}</NavLink>
              ))}
            </div>
          </section>
          <section className={`nav-group ${intelligenceOpen ? 'is-open' : ''}`}>
            <button type="button" className="nav-group-trigger" aria-expanded={intelligenceOpen} aria-controls="intelligence-links" onClick={() => setIntelligenceOpen((open) => !open)}>
              <ChartNoAxesCombined aria-hidden="true" /><span>Inteligencia</span><ChevronDown className="nav-chevron" aria-hidden="true" />
            </button>
            <div className="nav-group-list" id="intelligence-links">
              {intelligenceLinks.map(({ to, label, icon: Icon, count, tone }) => (
                <NavLink key={to} to={to}><Icon aria-hidden="true" /><span>{label}</span>{count > 0 && <span className={`nav-count tone-${tone}`} aria-label={`${count} notificaciones`}>{count}</span>}</NavLink>
              ))}
            </div>
          </section>
        </nav>
        <div className="operator-card">
          <span className="operator-avatar" aria-hidden="true">
            {employee?.firstName?.[0]}{employee?.lastName?.[0]}
          </span>
          <span>
            <strong>{employee?.firstName} {employee?.lastName}</strong>
            <small>Operaciones · sesión activa</small>
          </span>
        </div>
      </aside>
      <main className="operations-main">
        <header className="operations-header">
          <p className="operations-greeting">
            <span className="operations-greeting-icon" aria-hidden="true">
              <UserRound />
            </span>
            <span>Bienvenido,</span>
            <strong>{displayName}</strong>
          </p>
          <div className="operations-header-actions">
            <span className="realtime-state" role="status">{realtimeStatus}<span className="realtime-environment"> · Monitor</span></span>
            <time>{formatTime(now)} PET</time>
            <span className="operations-date">{formatShortDate(now)}</span>
            <Button variant="ghost" size="icon" aria-label="Cerrar sesión"
              onClick={() =>
                void signOut().finally(() =>
                  navigate(PATHS.LOGIN, { replace: true }),
                )
              }
            >
              <LogOut aria-hidden="true" />
            </Button>
          </div>
        </header>
        <div className="operations-content">
          <div className="operations-surface">
            {location.pathname !== PATHS.DASHBOARD && <div className="module-header">
              <h1 className="module-title">
                {onServiceDetail && moduleChild ? (
                  <>
                    <span className="module-crumb-parent">{moduleName}</span>
                    <span className="module-crumb-sep" aria-hidden="true">/</span>
                    <span className="module-crumb-child">{moduleChild}</span>
                  </>
                ) : (
                  moduleName
                )}
              </h1>
              <div className="module-header-actions">
                {moduleActions}
                {onServiceDetail && <ModuleBackButton to={cameFromOverview ? overviewReturnTo : PATHS.SERVICES} label={cameFromOverview ? 'Vista general' : 'Servicios'} />}
              </div>
            </div>}
            <Outlet />
          </div>
        </div>
      </main>
      </div>
    </ModuleHeaderContext.Provider>
  );
}
