import { useMemo, useState } from 'react';
import {
  Activity,
  CircleCheck,
  Clock3,
  Download,
  Gauge,
  RefreshCw,
  TriangleAlert,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { MotionTable, type MotionTableColumn } from '@/components/ui/motion-table';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SERVICE_STATUS_FILTER_OPTIONS } from '@/features/services/constants/service.constants';
import { getServiceStatusLabel } from '@/features/services/constants/service-status';
import type { ServiceCheck } from '@/features/services/types/service.types';
import { formatDateTime } from '@/shared/utils/format';

type PeriodFilter = '15M' | '1H' | '6H' | '24H' | '7D' | 'ALL';

const PERIOD_OPTIONS: Array<{ value: PeriodFilter; label: string }> = [
  { value: '15M', label: 'Últimos 15 minutos' },
  { value: '1H', label: 'Última hora' },
  { value: '6H', label: 'Últimas 6 horas' },
  { value: '24H', label: 'Últimas 24 horas' },
  { value: '7D', label: 'Últimos 7 días' },
  { value: 'ALL', label: 'Todo el historial' },
];

const checkColumns: MotionTableColumn<ServiceCheck>[] = [
  {
    key: 'checkedAt',
    header: 'Fecha',
    width: '26%',
    sortable: true,
    sortValue: (check) => new Date(check.checkedAt),
    cell: (check) => formatDateTime(check.checkedAt),
  },
  {
    key: 'status',
    header: 'Estado',
    width: '18%',
    sortable: true,
    sortValue: (check) => check.status,
    cell: (check) => (
      <span className={`status ${check.status.toLowerCase()}`}>
        {getServiceStatusLabel(check.status)}
      </span>
    ),
  },
  {
    key: 'latency',
    header: 'Latencia',
    width: '16%',
    align: 'left',
    sortable: true,
    sortValue: (check) => check.latencyMs,
    cell: (check) => <span className="tabular-value">{check.latencyMs} ms</span>,
  },
  {
    key: 'result',
    header: 'Resultado',
    width: '40%',
    cell: (check) => check.message ?? 'Comprobación completada sin observaciones.',
  },
];

function getPeriodStart(period: PeriodFilter): number | null {
  const hour = 60 * 60 * 1000;
  if (period === '15M') return Date.now() - 15 * 60 * 1000;
  if (period === '1H') return Date.now() - hour;
  if (period === '6H') return Date.now() - 6 * hour;
  if (period === '24H') return Date.now() - 24 * hour;
  if (period === '7D') return Date.now() - 7 * 24 * hour;
  return null;
}

function escapeCsv(value: string | number): string {
  const text = String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

function formatCompactDateTime(value: string): string {
  return new Date(value).toLocaleString('es-PE', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface ServiceCheckHistoryProps {
  checks: ServiceCheck[];
  serviceName: string;
  updatedAt: number;
  initialPeriod?: '15m' | '1h' | '6h' | '24h';
  observationRange?: { from: string; to: string };
}

export function ServiceCheckHistory({ checks, serviceName, updatedAt, initialPeriod, observationRange }: ServiceCheckHistoryProps) {
  const [status, setStatus] = useState('ALL');
  const [period, setPeriod] = useState<PeriodFilter>(() => initialPeriod ? ({ '15m': '15M', '1h': '1H', '6h': '6H', '24h': '24H' } as const)[initialPeriod] : '24H');
  const [selectedCheck, setSelectedCheck] = useState<ServiceCheck | null>(null);
  const [rangeActive, setRangeActive] = useState(!!observationRange);

  const sortedChecks = useMemo(
    () => [...checks].sort((a, b) => new Date(b.checkedAt).getTime() - new Date(a.checkedAt).getTime()),
    [checks],
  );

  const last24Hours = useMemo(() => {
    const start = Date.now() - 24 * 60 * 60 * 1000;
    return sortedChecks.filter((check) => new Date(check.checkedAt).getTime() >= start);
  }, [sortedChecks]);

  const filteredChecks = useMemo(() => {
    const start = rangeActive && observationRange ? Date.parse(observationRange.from) : getPeriodStart(period);
    const end = rangeActive && observationRange ? Date.parse(observationRange.to) : null;
    return sortedChecks.filter((check) =>
      (status === 'ALL' || check.status === status)
      && (start == null || new Date(check.checkedAt).getTime() >= start)
      && (end == null || new Date(check.checkedAt).getTime() < end),
    );
  }, [period, sortedChecks, status, rangeActive, observationRange]);

  const operationalChecks = last24Hours.filter((check) => check.status === 'OPERATIONAL');
  const availability = last24Hours.length
    ? `${Math.round((operationalChecks.length / last24Hours.length) * 100)}%`
    : 'Sin datos';
  const averageLatency = last24Hours.length
    ? `${Math.round(last24Hours.reduce((total, check) => total + check.latencyMs, 0) / last24Hours.length)} ms`
    : 'Sin datos';
  const lastSuccess = sortedChecks.find((check) => check.status === 'OPERATIONAL');
  const consecutiveFailures = sortedChecks.findIndex((check) => check.status === 'OPERATIONAL');
  const failureCount = consecutiveFailures === -1 ? sortedChecks.length : consecutiveFailures;

  function exportCsv() {
    const rows = [
      ['Fecha', 'Estado', 'Latencia (ms)', 'Resultado'],
      ...filteredChecks.map((check) => [
        formatDateTime(check.checkedAt),
        getServiceStatusLabel(check.status),
        check.latencyMs,
        check.message ?? '',
      ]),
    ];
    const csv = rows.map((row) => row.map(escapeCsv).join(',')).join('\r\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `historial-${serviceName.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="service-history" aria-labelledby="service-history-title">
      <header className="service-history-header">
        <div>
          <h2 id="service-history-title">Historial de comprobaciones</h2>
          <p>Seguimiento operativo y resultados de las sondas automáticas.</p>
        </div>
        <div className="service-history-live" aria-live="polite">
          <span><RefreshCw aria-hidden="true" /> Actualización automática · 10 s</span>
          <small>Última sincronización: {updatedAt ? formatDateTime(updatedAt) : 'Sin datos'}</small>
        </div>
      </header>

      <div className="service-history-summary" aria-label="Resumen de las últimas 24 horas">
        <article className="service-history-stat is-success">
          <CircleCheck aria-hidden="true" />
          <div><span>Disponibilidad 24 h</span><strong>{availability}</strong></div>
        </article>
        <article className="service-history-stat is-info">
          <Gauge aria-hidden="true" />
          <div><span>Latencia promedio</span><strong>{averageLatency}</strong></div>
        </article>
        <article className="service-history-stat is-neutral">
          <Clock3 aria-hidden="true" />
          <div><span>Última respuesta operativa</span><strong>{lastSuccess ? formatCompactDateTime(lastSuccess.checkedAt) : 'Sin registro'}</strong></div>
        </article>
        <article className={`service-history-stat ${failureCount ? 'is-warning' : 'is-success'}`}>
          <TriangleAlert aria-hidden="true" />
          <div><span>Fallos consecutivos</span><strong>{failureCount}</strong></div>
        </article>
      </div>

      {rangeActive && observationRange && <p className="service-history-hint">Intervalo seleccionado: {formatDateTime(observationRange.from)} a {formatDateTime(observationRange.to)}. Se filtran las últimas 50 observaciones disponibles; pueden no cubrir todo el intervalo. <Button type="button" variant="outline" onClick={() => setRangeActive(false)}>Ver periodo completo</Button></p>}
      <div className="service-history-toolbar">
        <div className="service-history-filters">
          <Select value={period} onValueChange={(value) => { setPeriod(value as PeriodFilter); setRangeActive(false); }}>
            <SelectTrigger aria-label="Filtrar por periodo"><SelectValue /></SelectTrigger>
            <SelectContent position="popper">
              <SelectGroup>
                {PERIOD_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger aria-label="Filtrar por estado"><SelectValue /></SelectTrigger>
            <SelectContent position="popper">
              <SelectGroup>
                {SERVICE_STATUS_FILTER_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <div className="service-history-toolbar-actions">
          <Badge variant="outline">{filteredChecks.length} resultados</Badge>
          <Button type="button" variant="outline" disabled={!filteredChecks.length} onClick={exportCsv}>
            <Download aria-hidden="true" /> Exportar CSV
          </Button>
        </div>
      </div>

      <MotionTable
        className="service-checks-table"
        data={filteredChecks}
        columns={checkColumns}
        getRowId={(check) => check.id}
        defaultSort={{ key: 'checkedAt', direction: 'desc' }}
        ariaLabel="Historial de comprobaciones"
        emptyState="No hay comprobaciones para los filtros seleccionados."
        maxHeight={480}
        onRowClick={setSelectedCheck}
      />
      <p className="service-history-hint"><Activity aria-hidden="true" /> Selecciona una fila para revisar el detalle de la comprobación.</p>

      <Dialog open={selectedCheck != null} onOpenChange={(open) => !open && setSelectedCheck(null)}>
        <DialogContent className="service-check-detail-dialog">
          <DialogHeader>
            <DialogTitle>Detalle de comprobación</DialogTitle>
            <DialogDescription>Información registrada por la sonda de supervisión.</DialogDescription>
          </DialogHeader>
          {selectedCheck && (
            <div className="service-check-detail-grid">
              <div className="is-full"><span>Referencia de observación</span><strong>{selectedCheck.id}</strong></div>
              <div><span>Estado</span><strong>{getServiceStatusLabel(selectedCheck.status)}</strong></div>
              <div><span>Latencia</span><strong>{selectedCheck.latencyMs} ms</strong></div>
              <div className="is-full"><span>Fecha y hora</span><strong>{formatDateTime(selectedCheck.checkedAt)}</strong></div>
              <div className="is-full"><span>Resultado</span><p>{selectedCheck.message ?? 'Comprobación completada sin observaciones.'}</p></div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
