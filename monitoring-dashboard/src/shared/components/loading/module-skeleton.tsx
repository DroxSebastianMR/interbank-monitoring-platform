import { Skeleton } from '@/components/ui/skeleton';

function SkeletonRows({ rows = 4, compact = false }: { rows?: number; compact?: boolean }) {
  return (
    <div className={compact ? 'module-skeleton-rows is-compact' : 'module-skeleton-rows'} aria-hidden="true">
      {Array.from({ length: rows }).map((_, index) => (
        <div className="module-skeleton-row" key={index}>
          <Skeleton className="module-skeleton-cell is-primary" />
          <Skeleton className="module-skeleton-cell is-status" />
          <Skeleton className="module-skeleton-cell is-short" />
          <Skeleton className="module-skeleton-cell is-medium" />
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 4, label = 'Cargando datos…' }: { rows?: number; label?: string }) {
  return (
    <section className="module-skeleton" role="status" aria-label={label} aria-busy="true">
      <span className="sr-only">{label}</span>
      <div className="module-skeleton-toolbar" aria-hidden="true">
        <Skeleton className="module-skeleton-control" />
        <Skeleton className="module-skeleton-control is-select" />
        <Skeleton className="module-skeleton-action" />
      </div>
      <div className="module-skeleton-table" aria-hidden="true">
        <Skeleton className="module-skeleton-table-head" />
        <SkeletonRows rows={rows} />
      </div>
    </section>
  );
}

export function DashboardSkeleton() {
  return (
    <section className="module-skeleton dashboard-skeleton" role="status" aria-label="Consultando el estado del monitor" aria-busy="true">
      <span className="sr-only">Consultando el estado del monitor…</span>
      <Skeleton className="dashboard-skeleton-alert" />
      <div className="dashboard-skeleton-metrics">
        {Array.from({ length: 4 }).map((_, index) => <Skeleton className="dashboard-skeleton-metric" key={index} />)}
      </div>
      <div className="dashboard-skeleton-panels">
        <Skeleton className="dashboard-skeleton-panel is-wide" />
        <Skeleton className="dashboard-skeleton-panel" />
      </div>
      <div className="module-skeleton-table">
        <Skeleton className="module-skeleton-table-head" />
        <SkeletonRows rows={3} />
      </div>
    </section>
  );
}

export function DetailSkeleton() {
  return (
    <section className="module-skeleton detail-skeleton" role="status" aria-label="Cargando detalle del servicio" aria-busy="true">
      <span className="sr-only">Cargando detalle del servicio…</span>
      <Skeleton className="detail-skeleton-back" />
      <Skeleton className="detail-skeleton-title" />
      <div className="dashboard-skeleton-metrics">
        {Array.from({ length: 4 }).map((_, index) => <Skeleton className="dashboard-skeleton-metric" key={index} />)}
      </div>
      <div className="module-skeleton-table">
        <Skeleton className="module-skeleton-table-head" />
        <SkeletonRows rows={4} />
      </div>
    </section>
  );
}

export function PanelSkeleton({ rows = 4, label = 'Cargando módulo…' }: { rows?: number; label?: string }) {
  return (
    <section className="panel-skeleton" role="status" aria-label={label} aria-busy="true">
      <span className="sr-only">{label}</span>
      <Skeleton className="panel-skeleton-title" />
      <SkeletonRows rows={rows} compact />
    </section>
  );
}

export function HealthSkeleton() {
  return (
    <section className="module-skeleton health-skeleton" role="status" aria-label="Consultando la salud del monitor" aria-busy="true">
      <span className="sr-only">Consultando la salud del monitor…</span>
      <Skeleton className="health-skeleton-title" />
      <div className="health-skeleton-box" aria-hidden="true">
        {['72%', '54%', '64%', '39%', '58%'].map((width, index) => (
          <Skeleton key={index} className="health-skeleton-line" style={{ width }} />
        ))}
      </div>
    </section>
  );
}
