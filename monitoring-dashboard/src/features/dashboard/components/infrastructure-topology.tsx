import type { DashboardTopology } from '@/features/dashboard/types/dashboard.types';

type TopologyNode = DashboardTopology['nodes'][number];

const nodePresentation: Record<string, { label: string; description: string; icon: string }> = {
  nginx: {
    label: 'NGINX',
    description: 'Gateway y balanceador de tráfico',
    icon: '⇄',
  },
  'app-backend-1': {
    label: 'API bancaria · réplica 01',
    description: 'Instancia de aplicación',
    icon: '01',
  },
  'app-backend-2': {
    label: 'API bancaria · réplica 02',
    description: 'Instancia de aplicación',
    icon: '02',
  },
};

const statusPresentation: Record<string, { label: string; tone: string }> = {
  OPERATIONAL: { label: 'Operativa', tone: 'operational' },
  DEGRADED: { label: 'Degradada', tone: 'degraded' },
  UNAVAILABLE: { label: 'No disponible', tone: 'unavailable' },
  RECOVERING: { label: 'Recuperando', tone: 'recovering' },
  NO_DATA: { label: 'Sin telemetría', tone: 'no_data' },
};

function getPresentation(node: TopologyNode) {
  return (
    nodePresentation[node.id] ?? {
      label: node.id,
      description: node.kind === 'gateway' ? 'Gateway de tráfico' : 'Instancia de aplicación',
      icon: node.kind === 'gateway' ? '⇄' : 'API',
    }
  );
}

function TopologyNodeCard({ node }: { node: TopologyNode }) {
  const presentation = getPresentation(node);
  const status = statusPresentation[node.status] ?? statusPresentation.NO_DATA;

  return (
    <article className={`topology-node topology-node-${node.kind}`}>
      <div className="topology-node-icon" aria-hidden="true">
        {presentation.icon}
      </div>
      <div className="topology-node-content">
        <span className="topology-node-kind">{node.kind === 'gateway' ? 'GATEWAY' : 'INSTANCIA'}</span>
        <strong>{presentation.label}</strong>
        <small>{presentation.description}</small>
      </div>
      <span className={`topology-status ${status.tone}`}>{status.label}</span>
    </article>
  );
}

export function InfrastructureTopology({ topology }: { topology: DashboardTopology }) {
  const gateway = topology.nodes.find((node) => node.kind === 'gateway');
  const instances = topology.nodes.filter((node) => node.kind !== 'gateway');
  const connectionCount = topology.edges.length;

  return (
    <section className="topology-card" aria-labelledby="topology-title">
      <div className="topology-header">
        <div>
          <p className="eyebrow">ARQUITECTURA DE EJECUCIÓN</p>
          <h2 id="topology-title">Ruta de tráfico de la aplicación</h2>
          <p>NGINX distribuye las solicitudes hacia las réplicas disponibles de la API bancaria.</p>
        </div>
        <span className="topology-connection-count">{connectionCount} rutas configuradas</span>
      </div>

      <div className="topology-flow" aria-label="NGINX distribuye tráfico a dos réplicas de la API bancaria">
        <div className="topology-entry" aria-hidden="true">
          <span className="topology-entry-icon">⌁</span>
          <span>Clientes</span>
        </div>
        <div className="topology-arrow topology-arrow-entry" aria-hidden="true" />

        {gateway ? <TopologyNodeCard node={gateway} /> : null}

        <div className="topology-branch" aria-hidden="true">
          <span>Balanceo</span>
        </div>

        <div className="topology-instances">
          {instances.map((node) => (
            <TopologyNodeCard key={node.id} node={node} />
          ))}
        </div>
      </div>

      <footer className="topology-footnote">
        <span className="topology-info" aria-hidden="true">i</span>
        Esta vista describe la configuración de despliegue. “Sin telemetría” no significa que una instancia esté caída; solo indica que aún no se mide de forma individual.
      </footer>
    </section>
  );
}
