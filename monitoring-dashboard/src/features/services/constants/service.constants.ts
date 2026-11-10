export const CRITICALITY_OPTIONS = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;

export const CRITICALITY_LABELS: Record<(typeof CRITICALITY_OPTIONS)[number], string> = {
  LOW: 'Baja',
  MEDIUM: 'Media',
  HIGH: 'Alta',
  CRITICAL: 'Crítica',
};

export const RISK_LEVEL_LABELS = {
  LOW: 'Bajo',
  MEDIUM: 'Medio',
  HIGH: 'Alto',
} as const;

export function getCriticalityLabel(value: string | null | undefined): string {
  if (!value) return 'Sin datos';
  return CRITICALITY_LABELS[value as keyof typeof CRITICALITY_LABELS] ?? value;
}

export function getRiskLevelLabel(value: string | null | undefined): string {
  if (!value) return 'Sin datos';
  return RISK_LEVEL_LABELS[value as keyof typeof RISK_LEVEL_LABELS] ?? value;
}

export const SERVICE_STATUS_FILTER_OPTIONS = [
  { value: 'ALL', label: 'Todos' },
  { value: 'OPERATIONAL', label: 'Operativo' },
  { value: 'DEGRADED', label: 'Degradado' },
  { value: 'UNAVAILABLE', label: 'No disponible' },
  { value: 'RECOVERING', label: 'Recuperando' },
] as const;

export const CRITICALITY_FILTER_OPTIONS = [
  { value: 'ALL', label: 'Todas' },
  { value: 'CRITICAL', label: 'Crítica' },
  { value: 'HIGH', label: 'Alta' },
  { value: 'MEDIUM', label: 'Media' },
  { value: 'LOW', label: 'Baja' },
] as const;

export const LATENCY_FILTER_OPTIONS = [
  { value: 'ALL', label: 'Todas' },
  { value: 'FAST', label: 'Menos de 500 ms' },
  { value: 'ELEVATED', label: '500 a 999 ms' },
  { value: 'SLOW', label: '1 s o más' },
  { value: 'NO_DATA', label: 'Sin datos' },
] as const;
