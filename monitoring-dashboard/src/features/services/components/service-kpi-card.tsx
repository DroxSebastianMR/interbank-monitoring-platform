import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

type ServiceKpiTone = 'neutral' | 'success' | 'warning' | 'critical' | 'info';

interface ServiceKpiGridProps {
  children: ReactNode;
  ariaLabel?: string;
  className?: string;
}

export function ServiceKpiGrid({
  children,
  ariaLabel = 'Indicadores clave del servicio',
  className,
}: ServiceKpiGridProps) {
  return (
    <section className={cn('service-kpi-grid', className)} aria-label={ariaLabel}>
      {children}
    </section>
  );
}

interface ServiceKpiCardProps {
  label: string;
  value: ReactNode;
  description: string;
  icon: LucideIcon;
  tone?: ServiceKpiTone;
  children?: ReactNode;
  footer?: ReactNode;
}

export function ServiceKpiCard({
  label,
  value,
  description,
  icon: Icon,
  tone = 'neutral',
  children,
  footer,
}: ServiceKpiCardProps) {
  return (
    <article className={cn('service-kpi-card', `service-kpi-${tone}`)}>
      <header className="service-kpi-header">
        <span>{label}</span>
        <span className="service-kpi-icon" aria-hidden="true">
          <Icon />
        </span>
      </header>
      <strong className="service-kpi-value">{value}</strong>
      <p className="service-kpi-description">
        <i aria-hidden="true" />
        {description}
      </p>
      {children}
      {footer}
    </article>
  );
}
