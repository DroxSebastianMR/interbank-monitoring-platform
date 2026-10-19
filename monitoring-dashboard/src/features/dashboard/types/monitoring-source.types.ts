export interface MonitoringSource {
  id: string;
  label: string;
  allowed: boolean;
  hasData: boolean;
  isPending: boolean;
  isPaused: boolean;
  isFetching: boolean;
  error: unknown;
  updatedAt: number;
  observedAt?: string | null;
}
