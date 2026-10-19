import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

interface PanelProps {
  title?: ReactNode;
  children: ReactNode;
  className?: string;
  id?: string;
}

export function Panel({ title, children, className, id }: PanelProps) {
  return (
    <section
      className={cn('table-card', className)}
      aria-labelledby={title && id ? id : undefined}
    >
      {title ? <h2 id={id}>{title}</h2> : null}
      {children}
    </section>
  );
}
