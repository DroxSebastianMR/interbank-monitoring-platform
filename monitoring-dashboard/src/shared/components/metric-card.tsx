import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

interface MetricGridProps {
  children: ReactNode;
  className?: string;
}

export function MetricGrid({ children, className }: MetricGridProps) {
  return <div className={cn('metrics', className)}>{children}</div>;
}

interface MetricCardProps {
  label: ReactNode;
  value: ReactNode;
}

export function MetricCard({ label, value }: MetricCardProps) {
  return (
    <article>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}
