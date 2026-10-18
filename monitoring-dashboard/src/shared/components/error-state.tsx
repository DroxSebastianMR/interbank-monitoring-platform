import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

interface ErrorStateProps {
  children: ReactNode;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

export function ErrorState({
  children,
  onRetry,
  retryLabel = 'Reintentar',
  className = 'notice error',
}: ErrorStateProps) {
  return (
    <div role="alert" className={cn(className)}>
      {children}
      {onRetry ? (
        <>
          {' '}
          <button onClick={onRetry}>{retryLabel}</button>
        </>
      ) : null}
    </div>
  );
}
