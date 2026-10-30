import type { OperationalEvaluation } from '@/modules/monitoring/interfaces/operational-evaluation';

export interface IncidentEvidence {
  reasons: string[];
  anomalyScore: number;
  observedAt: string;
  evaluation?: OperationalEvaluation;
}
