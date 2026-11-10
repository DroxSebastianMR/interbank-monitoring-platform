import { useState, type FormEvent } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { incidentWorkflowService, type IncidentCommand, type IncidentDetail } from '@/features/incidents/services/incident-workflow.service';
import { attentionLabels, nextAttentionStates, severityLabels } from '@/features/incidents/constants/incident-workflow';

const selectClass = 'h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-2 focus-visible:outline-emerald-600 disabled:opacity-50';
const actions = { note: 'Registrar nota', assign: 'Asignar responsable', acknowledge: 'Reconocer incidente', transition: 'Cambiar atención', reclassify: 'Reclasificar severidad', close: 'Cerrar expediente' };

export function IncidentActions({ incident, employeeId, onSaved }: { incident: IncidentDetail; employeeId: string; onSaved: () => void }) {
  const [action, setAction] = useState<IncidentCommand['action']>('note');
  const [version, setVersion] = useState(incident.version);
  const [reason, setReason] = useState('');
  const [text, setText] = useState('');
  const [value, setValue] = useState('');
  const [uncertain, setUncertain] = useState<IncidentCommand | null>(null);
  const [feedback, setFeedback] = useState('');
  const assignees = useQuery({ queryKey: ['incident-assignees', employeeId], queryFn: incidentWorkflowService.assignees,
    enabled: action === 'assign', staleTime: 30_000, retry: false });
  const mutation = useMutation({
    mutationFn: (command: IncidentCommand) => incidentWorkflowService.execute(incident.id, command), retry: false,
    onSuccess: (receipt) => {
      setVersion(receipt.appliedVersion); setUncertain(null); setReason(''); setText(''); setValue('');
      setFeedback(receipt.replayed ? 'La operación ya estaba registrada; no se duplicó.' : 'Cambio registrado en el expediente.');
      onSaved();
    },
    onError: (error, command) => {
      const status = isAxiosError(error) ? error.response?.status : undefined;
      if (!status || status >= 500) {
        setUncertain(command); setFeedback('No se pudo confirmar el resultado. Reintenta el mismo comando para evitar duplicados.');
      } else {
        setUncertain(null);
        const body = isAxiosError(error) ? error.response?.data as { message?: unknown } : undefined;
        setFeedback(typeof body?.message === 'string' ? body.message : 'No se pudo registrar el cambio. Revisa los datos o tus permisos.');
        if (status === 409) onSaved();
      }
    },
  });
  const outdated = version !== incident.version;
  const nextStates = nextAttentionStates[incident.attentionState] ?? [];
  const disabled = mutation.isPending || !!uncertain;
  const blocked = action === 'close' && incident.closureBlockers.length > 0;

  function submit(event: FormEvent) {
    event.preventDefault();
    if (uncertain) { mutation.mutate(uncertain); return; }
    if (outdated || blocked) return;
    const body: IncidentCommand['body'] = { expectedVersion: version, commandId: crypto.randomUUID(), reason: reason.trim() };
    if (action === 'assign') body.assigneeId = value;
    if (action === 'transition') body.nextState = value;
    if (action === 'reclassify') body.severity = value;
    if (action === 'note') body.note = text.trim();
    if (action === 'close') body.summary = text.trim();
    setFeedback(''); mutation.mutate({ action, body });
  }

  return <form className="space-y-4" onSubmit={submit} aria-label="Atención del incidente">
    <p className="text-sm text-slate-600">Los cambios de atención no modifican el estado técnico del servicio.</p>
    {outdated && !uncertain && <div role="status" className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
      El expediente cambió mientras editabas. Revisa los nuevos datos antes de continuar.
      <Button className="mt-2" type="button" variant="outline" onClick={() => { setVersion(incident.version); setReason(''); setText(''); setValue(''); setFeedback('Formulario actualizado a la versión vigente.'); }}>Usar versión actual</Button>
    </div>}
    <fieldset disabled={disabled} className="space-y-4">
      <div className="space-y-2"><Label htmlFor="incident-action">Acción</Label><select id="incident-action" className={selectClass} value={action} onChange={(e) => { setAction(e.target.value as IncidentCommand['action']); setValue(''); setText(''); }}>
        {Object.entries(actions).map(([key, label]) => <option key={key} value={key} disabled={(key === 'acknowledge' && (!incident.assigneeId || !!incident.acknowledgedAt)) || (key === 'transition' && (!nextStates.length || !incident.acknowledgedAt))}>{label}</option>)}
      </select></div>
      {action === 'assign' && <div className="space-y-2"><Label htmlFor="incident-owner">Responsable</Label>
        {assignees.isError ? <p role="alert" className="text-sm">No se pudo consultar responsables. <button type="button" className="underline" onClick={() => void assignees.refetch()}>Reintentar</button></p>
          : <select required id="incident-owner" className={selectClass} value={value} onChange={(e) => setValue(e.target.value)} disabled={assignees.isPending}>
            <option value="">{assignees.isPending ? 'Consultando responsables…' : 'Seleccionar responsable'}</option>
            {assignees.data?.map((person) => <option key={person.id} value={person.id}>{person.firstName} {person.lastName} · {person.employeeCode}</option>)}
          </select>}
        <p className="text-xs text-slate-500">Hasta 100 responsables activos con permisos de atención.</p>
      </div>}
      {action === 'transition' && <div className="space-y-2"><Label htmlFor="incident-next-state">Siguiente estado de atención</Label><select required id="incident-next-state" className={selectClass} value={value} onChange={(e) => setValue(e.target.value)}><option value="">Seleccionar estado</option>{nextStates.map((state) => <option key={state} value={state}>{attentionLabels[state]}</option>)}</select></div>}
      {action === 'reclassify' && <div className="space-y-2"><Label htmlFor="incident-severity">Severidad</Label><select required id="incident-severity" className={selectClass} value={value} onChange={(e) => setValue(e.target.value)}><option value="">Seleccionar severidad</option>{Object.entries(severityLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></div>}
      {(action === 'note' || action === 'close') && <div className="space-y-2"><Label htmlFor="incident-note">{action === 'close' ? 'Resumen y conclusión del cierre' : 'Nota de investigación'}</Label><Textarea id="incident-note" required maxLength={2000} value={text} onChange={(e) => setText(e.target.value)} /></div>}
      <div className="space-y-2"><Label htmlFor="incident-reason">Motivo</Label><Input id="incident-reason" required maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} /></div>
    </fieldset>
    {blocked && <p className="text-sm text-amber-800">El cierre permanece bloqueado por las condiciones indicadas en el expediente.</p>}
    <Button type="submit" disabled={mutation.isPending || (!uncertain && (outdated || blocked || !reason.trim() || ((action === 'note' || action === 'close') && !text.trim()) || (['assign', 'transition', 'reclassify'].includes(action) && !value)))}>
      {mutation.isPending ? 'Guardando…' : uncertain ? 'Reintentar mismo comando' : 'Guardar cambio'}
    </Button>
    {feedback && <p className="text-sm" role="status" aria-live="polite">{feedback}</p>}
  </form>;
}
