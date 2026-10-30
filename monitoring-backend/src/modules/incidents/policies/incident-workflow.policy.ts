import { ConflictException } from '@nestjs/common';
import { IncidentAttentionState as State, IncidentSeverity } from '@/modules/incidents/enums/incident-workflow.enum';

export const attentionTransitions: Record<string, readonly State[]> = {
  [State.DETECTED]: [State.INVESTIGATING],
  [State.INVESTIGATING]: [State.IDENTIFIED, State.RECOVERING],
  [State.IDENTIFIED]: [State.RECOVERING],
};

export function assertAttentionTransition(current: string, next: State): void {
  if (!attentionTransitions[current]?.includes(next)) {
    throw new ConflictException('Transición de atención no permitida. La recuperación técnica corresponde al motor.');
  }
}

export function technicalSeverity(unavailable: boolean, criticality: string): IncidentSeverity {
  const important = criticality === 'HIGH' || criticality === 'CRITICAL';
  return unavailable ? (important ? IncidentSeverity.CRITICAL : IncidentSeverity.HIGH)
    : (important ? IncidentSeverity.HIGH : IncidentSeverity.MEDIUM);
}
