import { ArrowUpRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { PATHS } from '@/app/router/constants/paths';
import { MotionTable, type MotionTableColumn } from '@/components/ui/motion-table';
import { ServiceStatusBadge } from '@/features/services/components/service-status-badge';
import type { MonitoredService } from '@/features/services/types/service.types';
import { formatDateTime } from '@/shared/utils/format';

const columns: MotionTableColumn<MonitoredService>[] = [
  {
    key: 'service', header: 'Servicio', width: '30%', sortable: true,
    sortValue: (service) => service.name,
    cell: (service) => <span className="service-name-cell"><strong>{service.name}</strong><small>{service.monitoringEnabled === false ? 'Supervisión pausada' : 'Supervisión activa'}</small></span>,
  },
  {
    key: 'status', header: 'Estado', width: '20%', sortable: true,
    sortValue: (service) => service.status,
    cell: (service) => <ServiceStatusBadge status={service.status} />,
  },
  {
    key: 'latency', header: 'Latencia', width: '17%', sortable: true,
    sortValue: (service) => service.latencyMs,
    cell: (service) => service.latencyMs == null ? 'Sin datos' : <span className="tabular-value">{Math.round(service.latencyMs)} ms</span>,
  },
  {
    key: 'lastCheck', header: 'Última comprobación', width: '27%', sortable: true,
    sortValue: (service) => service.lastCheckedAt ? new Date(service.lastCheckedAt) : null,
    cell: (service) => service.lastCheckedAt ? formatDateTime(service.lastCheckedAt) : 'Sin observaciones',
  },
  {
    key: 'open', header: '', width: '6%', align: 'right',
    cell: () => <ArrowUpRight className="dashboard-service-open" aria-hidden="true" />,
  },
];

export function DashboardServiceTable({ services }: { services: MonitoredService[] }) {
  const navigate = useNavigate();
  return (
    <MotionTable
      className="dashboard-services-table"
      data={services.slice(0, 5)}
      columns={columns}
      getRowId={(service) => service.id}
      defaultSort={{ key: 'service', direction: 'asc' }}
      ariaLabel="Resumen de servicios digitales"
      onRowClick={(service) => navigate(PATHS.SERVICE_DETAIL(service.id))}
    />
  );
}
