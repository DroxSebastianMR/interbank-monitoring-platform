import { IncidentsRepository } from '@/modules/incidents/repositories/incidents.repository';
import { IncidentWorkflowRepository } from '@/modules/incidents/repositories/incident-workflow.repository';
import { IncidentsService } from '@/modules/incidents/services/incidents.service';
import { ServiceStatus } from '@/modules/service-state/interfaces/service-state';
import { assertAttentionTransition, technicalSeverity } from '@/modules/incidents/policies/incident-workflow.policy';
import { IncidentAttentionState as State } from '@/modules/incidents/enums/incident-workflow.enum';

describe('Incident attention policy', () => {
  it('permits the investigation path without allowing operator resolution', () => {
    expect(() => assertAttentionTransition(State.DETECTED, State.INVESTIGATING)).not.toThrow();
    expect(() => assertAttentionTransition(State.INVESTIGATING, State.IDENTIFIED)).not.toThrow();
    expect(() => assertAttentionTransition(State.IDENTIFIED, State.RECOVERING)).not.toThrow();
    expect(() => assertAttentionTransition(State.RECOVERING, State.RESOLVED)).toThrow();
    expect(() => assertAttentionTransition(State.DETECTED, State.CLOSED)).toThrow();
  });
  it('calculates severity from technical condition and service criticality', () => {
    expect(technicalSeverity(true, 'HIGH')).toBe('CRITICAL');
    expect(technicalSeverity(true, 'LOW')).toBe('HIGH');
    expect(technicalSeverity(false, 'HIGH')).toBe('HIGH');
    expect(technicalSeverity(false, 'LOW')).toBe('MEDIUM');
  });
  it('keeps technical synchronization inside the atomic repository operation', async () => {
    const sync = jest.fn().mockResolvedValue(undefined);
    const repository = { sync } as unknown as IncidentsRepository;
    const service = new IncidentsService(repository, {} as IncidentWorkflowRepository);
    const evidence = { reasons: ['confirmed failure'], anomalyScore: 0, observedAt: new Date().toISOString() };
    await service.sync('login', ServiceStatus.UNAVAILABLE, evidence);
    expect(sync).toHaveBeenCalledWith('login', ServiceStatus.UNAVAILABLE, evidence);
  });
});
