import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from '@/app/providers/auth/use-auth';
import { PATHS } from '@/app/router/constants/paths';
const links = [
  [PATHS.DASHBOARD, "Resumen"],
  [PATHS.SERVICES, "Servicios"],
  [PATHS.INCIDENTS, "Incidentes"],
  [PATHS.ALERTS, "Alertas"],
  [PATHS.ANALYTICS, "Analítica"],
  [PATHS.HEALTH, "Health"],
];
export function OperationsLayout() {
  const { employee, signOut } = useAuth();
  const navigate = useNavigate();
  return (
    <div className="shell">
      <aside>
        <div className="brand">
          <span className="pulse" />
          Sentinel
        </div>
        <p className="eyebrow">MONITORING PLATFORM</p>
        <nav>
          {links.map(([to, label]) => (
            <NavLink key={to} to={to} end={to === "/"}>
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="aside-foot">
          <span className="dot" />
          Sesión de {employee?.firstName ?? "empleado"}
        </div>
      </aside>
      <main>
        <header>
          <div>
            <p className="eyebrow">CENTRO DE OPERACIONES</p>
            <h1>Estado de servicios</h1>
          </div>
          <div className="header-actions">
            <span>
              {employee?.firstName} {employee?.lastName}
            </span>
            <button
              onClick={() =>
                void signOut().finally(() =>
                  navigate(PATHS.LOGIN, { replace: true }),
                )
              }
            >
              Salir
            </button>
          </div>
        </header>
        <Outlet />
      </main>
    </div>
  );
}
