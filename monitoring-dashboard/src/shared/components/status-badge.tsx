import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

export type StatusTone = 'operational' | 'degraded' | 'unavailable' | 'recovering' | 'no_data';

interface StatusBadgeProps {
  tone: StatusTone;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
  title?: string;
}

export function StatusBadge({ tone, icon, children, className, title }: StatusBadgeProps) {
  return (
    <span className={cn('status', tone, className)} title={title}>
      {icon}
      {children}
    </span>
  );
}
