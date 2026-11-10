import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

interface PanelProps {
  title?: ReactNode;
  children: ReactNode;
  className?: string;
  id?: string;
  ariaLabelledBy?: string;
  variant?: 'default' | 'flat';
}

export function Panel({
  title,
  children,
  className,
  id,
  ariaLabelledBy,
  variant = 'default',
}: PanelProps) {
  return (
    <section
      className={cn('table-card', variant === 'flat' && 'flat-panel', className)}
      aria-labelledby={ariaLabelledBy ?? (title && id ? id : undefined)}
    >
      {title ? <h2 id={id}>{title}</h2> : null}
      {children}
    </section>
  );
}
