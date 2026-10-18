import { Link } from "react-router-dom";
import type { MonitoredService } from '@/features/services/types/service.types';
import { PATHS } from '@/app/router/constants/paths';
import { ServiceStatusBadge } from '@/features/services/components/service-status-badge';
import { getCriticalityLabel } from '@/features/services/constants/service.constants';
import { MotionTable, type MotionTableColumn } from '@/components/ui/motion-table';
import { formatDateTime } from '@/shared/utils/format';

const serviceColumns: MotionTableColumn<MonitoredService>[] = [
  {
    key: 'name', header: 'Servicio', width: '28%', sortable: true,
    sortValue: (service) => service.name,
    cell: (service) => <span className="service-name-cell"><Link to={PATHS.SERVICE_DETAIL(service.id)}><strong>{service.name}</strong></Link><small>{service.message}</small></span>,
  },
  {
    key: 'status', header: 'Estado', width: '17%', sortable: true,
    sortValue: (service) => service.status,
    cell: (service) => <ServiceStatusBadge status={service.status} />,
  },
  { key: 'criticality', header: 'Criticidad', width: '14%', sortable: true, sortValue: (service) => service.criticality, cell: (service) => getCriticalityLabel(service.criticality) },
  { key: 'latency', header: 'Latencia', width: '14%', align: 'left', sortable: true, sortValue: (service) => service.latencyMs, cell: (service) => service.latencyMs == null ? 'Sin datos' : <span className="tabular-value">{service.latencyMs} ms</span> },
  { key: 'lastCheck', header: 'Última comprobación', width: '27%', sortable: true, sortValue: (service) => service.lastCheckedAt ? new Date(service.lastCheckedAt) : null, cell: (service) => service.lastCheckedAt ? formatDateTime(service.lastCheckedAt) : 'Sin observaciones' },
];

export function ServiceTable({ services }: { services: MonitoredService[] }) {
  return <MotionTable data={services} columns={serviceColumns} getRowId={(service) => service.id} defaultSort={{ key: 'name', direction: 'asc' }} ariaLabel="Servicios monitoreados" />;
}
