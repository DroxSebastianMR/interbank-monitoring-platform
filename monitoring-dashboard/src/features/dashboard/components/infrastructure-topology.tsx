import { Info, Network, Server, Users } from 'lucide-react';
import type { DashboardTopology } from '@/features/dashboard/types/dashboard.types';
import { SERVICE_STATUS_META } from '@/features/services/constants/service-status';
import type { ServiceStatus } from '@/features/services/types/service.types';
import { formatDateTime } from '@/shared/utils/format';

type TopologyNode = DashboardTopology['nodes'][number];

const KNOWN_STATUSES: ServiceStatus[] = ['OPERATIONAL', 'DEGRADED', 'UNAVAILABLE', 'RECOVERING', 'NO_DATA'];

const nodePresentation: Record<string, { label: string; description: string; icon: typeof Server }> = {
  nginx: { label: 'NGINX', description: 'Gateway y balanceador de tráfico', icon: Network },
  'app-backend-1': { label: 'API bancaria · réplica 01', description: 'Instancia de aplicación', icon: Server },
  'app-backend-2': { label: 'API bancaria · réplica 02', description: 'Instancia de aplicación', icon: Server },
};

function normalizeStatus(status: string): ServiceStatus {
  return KNOWN_STATUSES.includes(status as ServiceStatus) ? status as ServiceStatus : 'NO_DATA';
}

function getPresentation(node: TopologyNode) {
  return nodePresentation[node.id] ?? {
    label: node.id,
    description: node.kind === 'gateway' ? 'Gateway de tráfico' : 'Instancia de aplicación',
    icon: node.kind === 'gateway' ? Network : Server,
  };
}

function TopologyNodeItem({ node, connected = true }: { node: TopologyNode; connected?: boolean }) {
  const presentation = getPresentation(node);
  const status = normalizeStatus(node.status);
  const Icon = presentation.icon;

  return (
    <article className={`topology-node topology-node-${node.kind} status-${status.toLowerCase()}${connected ? '' : ' is-disconnected'}`}>
      <span className="topology-node-icon" aria-hidden="true"><Icon /></span>
      <span className="topology-node-content">
        <span className="topology-node-kind">{node.kind === 'gateway' ? 'Gateway' : 'Instancia'}</span>
        <strong>{presentation.label}</strong>
        <small>{presentation.description}</small>
      </span>
      <span className="topology-node-status"><i aria-hidden="true" />{SERVICE_STATUS_META[status].label}</span>
    </article>
  );
}

function RoutePulse() {
  return <span className="traffic-route-pulse" aria-hidden="true"><i /></span>;
}

export function InfrastructureTopology({ topology }: { topology: DashboardTopology }) {
  const gateway = topology.nodes.find((node) => node.kind === 'gateway');
  const instances = topology.nodes.filter((node) => node.id !== gateway?.id);
  const connectedTargets = new Set(
    gateway ? topology.edges.filter((edge) => edge.from === gateway.id).map((edge) => edge.to) : [],
  );
  const orderedInstances = [...instances].sort((left, right) => Number(connectedTargets.has(right.id)) - Number(connectedTargets.has(left.id)));
  const operationalCount = topology.nodes.filter((node) => normalizeStatus(node.status) === 'OPERATIONAL').length;
  const statuses = [...new Set(topology.nodes.map((node) => normalizeStatus(node.status)))];
  const hasMissingTelemetry = statuses.includes('NO_DATA');

  return (
    <section className="topology-card" aria-labelledby="topology-title">
      <header className="topology-header">
        <div>
          <h2 id="topology-title">Ruta de tráfico de la aplicación</h2>
          <p>Recorrido configurado desde la entrada de clientes hasta las instancias de la API bancaria.</p>
        </div>
        <div className="topology-summary">
          <div>
            <span className="topology-node-count">{operationalCount} de {topology.nodes.length} operativos</span>
            <span className="topology-connection-count">{topology.edges.length} rutas configuradas</span>
          </div>
          <small>{topology.observedAt ? `Observada ${formatDateTime(topology.observedAt)}` : 'Sin observación reciente'}</small>
        </div>
      </header>

      <figure className="traffic-map" aria-labelledby="topology-title">
        <figcaption className="sr-only">
          Flujo configurado desde clientes hacia {gateway ? getPresentation(gateway).label : 'un gateway no informado'} y {orderedInstances.length} instancias.
        </figcaption>

        <div className="traffic-entry">
          <span aria-hidden="true"><Users /></span>
          <strong>Clientes</strong>
          <small>Entrada externa</small>
        </div>
        <div className="traffic-entry-route"><RoutePulse /></div>

        {gateway ? <TopologyNodeItem node={gateway} /> : <div className="topology-missing-node">Gateway no informado</div>}

        <div className="traffic-distributor" aria-hidden="true"><span>Balanceo</span></div>

        <div className="topology-instances">
          {orderedInstances.map((node) => {
            const connected = connectedTargets.has(node.id);
            return (
              <div className="topology-instance-row" key={node.id}>
                <div className={`traffic-instance-route${connected ? '' : ' is-disconnected'}`}>{connected ? <RoutePulse /> : null}</div>
                <TopologyNodeItem node={node} connected={connected} />
              </div>
            );
          })}
        </div>

        <ul className="sr-only">
          {topology.edges.map((edge) => <li key={`${edge.from}-${edge.to}`}>{edge.from} se conecta con {edge.to}</li>)}
        </ul>
      </figure>

      <footer className="topology-footer">
        <div className="topology-legend" aria-label="Estados presentes en la topología">
          {statuses.map((status) => (
            <span className={`status-${status.toLowerCase()}`} key={status}><i aria-hidden="true" />{SERVICE_STATUS_META[status].label}</span>
          ))}
        </div>
        <p className={hasMissingTelemetry ? 'is-warning' : ''}>
          <Info aria-hidden="true" />
          {hasMissingTelemetry
            ? '“Sin datos” indica telemetría pendiente; no confirma que el nodo esté caído.'
            : 'El movimiento muestra la dirección configurada de la ruta, no volumen de tráfico en tiempo real.'}
        </p>
      </footer>
    </section>
  );
}
