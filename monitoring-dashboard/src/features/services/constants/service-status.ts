import { CircleCheck, CircleDashed, CircleX, RotateCw, TriangleAlert } from 'lucide-react';

import type { ServiceStatus } from '@/features/services/types/service.types';
import type { StatusTone } from '@/shared/components/status-badge';

export interface ServiceStatusMeta {
  label: string;
  description: string;
  tone: StatusTone;
  icon: typeof CircleCheck;
}

export const SERVICE_STATUS_META: Record<ServiceStatus, ServiceStatusMeta> = {
  OPERATIONAL: { label: 'Operativo', description: 'La última comprobación respondió correctamente.', tone: 'operational', icon: CircleCheck },
  DEGRADED: { label: 'Degradado', description: 'El servicio responde, pero presenta latencia o señales de riesgo.', tone: 'degraded', icon: TriangleAlert },
  UNAVAILABLE: { label: 'No disponible', description: 'La comprobación no obtuvo una respuesta válida dentro del tiempo esperado.', tone: 'unavailable', icon: CircleX },
  RECOVERING: { label: 'Recuperando', description: 'El servicio volvió a responder y se está confirmando su estabilidad.', tone: 'recovering', icon: RotateCw },
  NO_DATA: { label: 'Sin datos', description: 'Todavía no existe una comprobación válida para este servicio.', tone: 'no_data', icon: CircleDashed },
};

const ADDITIONAL_STATUS_LABELS: Record<string, string> = {
  UP: 'En línea',
  DOWN: 'Fuera de línea',
  HEALTHY: 'Saludable',
  UNHEALTHY: 'Con fallas',
  UNKNOWN: 'Desconocido',
  ACTIVE: 'Activo',
  PAUSED: 'Pausado',
};

export function getServiceStatusLabel(status: string): string {
  return SERVICE_STATUS_META[status as ServiceStatus]?.label
    ?? ADDITIONAL_STATUS_LABELS[status]
    ?? status;
}
