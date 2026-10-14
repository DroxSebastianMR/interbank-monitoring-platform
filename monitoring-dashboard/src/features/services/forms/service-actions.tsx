import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { servicesService } from '@/features/services/services/services.service';
import type { MonitoredService } from '@/features/services/types/service.types';

export function ServiceActions({ service }: { service: MonitoredService }) {
  const queryClient = useQueryClient();
  const [reason, setReason] = useState('');
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(service.name);
  const [endpoint, setEndpoint] = useState(service.path ?? '');
  const [criticality, setCriticality] = useState(service.criticality ?? 'HIGH');
  const invalidate = () => {
    for (const queryKey of [
      ['monitored-service', service.id],
      ['monitored-service-checks', service.id],
      ['monitored-service-state-history', service.id],
      ['monitored-service-config-history', service.id],
      ['monitored-services'],
      ['dashboard-overview'],
    ]) void queryClient.invalidateQueries({ queryKey });
  };
  const action = useMutation({
    mutationFn: (kind: 'pause' | 'resume' | 'check') =>
      kind === 'pause' ? servicesService.pause(service.id, reason)
        : kind === 'resume' ? servicesService.resume(service.id) : servicesService.check(service.id),
    onSuccess: invalidate,
  });
  const update = useMutation({
    mutationFn: () => servicesService.update(service.id, {
      name, endpoint, criticality, expectedVersion: service.version ?? 1, reason,
    }),
    onSuccess: () => { invalidate(); setEditing(false); },
  });
  return <section className="table-card service-form">
    <h2>Acciones autorizadas</h2>
    <div className="service-actions">
      <button disabled={action.isPending || service.monitoringEnabled === false}
        onClick={() => action.mutate('check')}>Comprobar ahora</button>
      <button disabled={action.isPending || (service.monitoringEnabled !== false && !reason.trim())}
        onClick={() => action.mutate(service.monitoringEnabled === false ? 'resume' : 'pause')}>
        {service.monitoringEnabled === false ? 'Reanudar' : 'Pausar'}
      </button>
      <button onClick={() => setEditing(!editing)}>{editing ? 'Cancelar edición' : 'Editar configuración'}</button>
    </div>
    <label>Motivo de la acción
      <input value={reason} onChange={(event) => setReason(event.target.value)} maxLength={500} />
    </label>
    {(action.isError || update.isError) && <p role="alert" className="form-error">
      No se pudo completar la acción. Comprueba los permisos, la versión y la conexión.
    </p>}
    {editing && <form onSubmit={(event) => { event.preventDefault(); update.mutate(); }}>
      <label>Nombre<input required value={name} onChange={(event) => setName(event.target.value)} /></label>
      <label>Ruta health<input required placeholder="/auth/health" value={endpoint}
        onChange={(event) => setEndpoint(event.target.value)} /></label>
      <label>Criticidad<select value={criticality} onChange={(event) => setCriticality(event.target.value)}>
        {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((value) => <option key={value}>{value}</option>)}
      </select></label>
      <button disabled={update.isPending || !reason.trim()}>Guardar cambios</button>
    </form>}
  </section>;
}
