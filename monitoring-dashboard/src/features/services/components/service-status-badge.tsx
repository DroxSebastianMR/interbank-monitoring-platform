import { SERVICE_STATUS_META } from '@/features/services/constants/service-status';
import type { ServiceStatus } from '@/features/services/types/service.types';
import { StatusBadge } from '@/shared/components/status-badge';

interface ServiceStatusBadgeProps {
  status: ServiceStatus;
  showIcon?: boolean;
  className?: string;
}

export function ServiceStatusBadge({
  status,
  showIcon = true,
  className,
}: ServiceStatusBadgeProps) {
  const { label, description, tone, icon: Icon } = SERVICE_STATUS_META[status];
  return (
    <StatusBadge
      tone={tone}
      className={className}
      icon={showIcon ? <Icon aria-hidden="true" /> : undefined}
      title={description}
    >
      {label}
    </StatusBadge>
  );
}
