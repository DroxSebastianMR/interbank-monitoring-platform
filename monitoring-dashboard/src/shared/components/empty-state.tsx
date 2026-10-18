import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

interface EmptyStateProps {
  children: ReactNode;
  className?: string;
}

export function EmptyState({ children, className = 'notice' }: EmptyStateProps) {
  return <div className={cn(className)}>{children}</div>;
}
