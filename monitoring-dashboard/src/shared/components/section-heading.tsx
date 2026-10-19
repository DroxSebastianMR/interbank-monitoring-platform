import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

interface SectionHeadingProps {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  id?: string;
  className?: string;
}

export function SectionHeading({
  title,
  description,
  actions,
  id,
  className,
}: SectionHeadingProps) {
  return (
    <div className={cn('section-heading', className)}>
      <div>
        <h2 id={id}>{title}</h2>
        {description ? <p>{description}</p> : null}
      </div>
      {actions}
    </div>
  );
}
