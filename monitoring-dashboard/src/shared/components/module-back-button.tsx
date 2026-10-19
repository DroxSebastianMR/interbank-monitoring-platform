import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

import { cn } from '@/lib/utils';

interface ModuleBackButtonProps {
  to: string;
  label: string;
  className?: string;
}

export function ModuleBackButton({ to, label, className }: ModuleBackButtonProps) {
  return (
    <Link
      aria-label={`Volver a ${label}`}
      className={cn('module-back-button', className)}
      to={to}
    >
      <ArrowLeft aria-hidden="true" />
      <span>{label}</span>
    </Link>
  );
}
