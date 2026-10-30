import { useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { Link, Navigate, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '@/app/providers/auth/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PanelSkeleton } from '@/shared/components/loading/module-skeleton';
import { useIncidentDetail } from '@/features/incidents/hooks/use-incident-detail';
import { IncidentPublications } from '@/features/incidents/components/incident-publications';
import { IncidentActions } from '@/features/incidents/forms/incident-actions';
import { attentionLabels, eventLabels, severityLabels } from '@/features/incidents/constants/incident-workflow';

const date = (value: string | null) => value ? new Date(value).toLocaleString('es-PE', { timeZone: 'America/Lima' }) : 'Sin registro';
const technicalLabels: Record<string, string> = { OPERATIONAL: 'Operativo', DEGRADED: 'Degradado', UNAVAILABLE: 'No disponible', RECOVERING: 'En verificación de recuperación' };
function note(payload: unknown) {
  if (!payload || typeof payload !== 'object' || !('note' in payload)) return null;
  return typeof payload.note === 'string' ? payload.note : null;
}

export function IncidentDetailPage() {
  const { id = '' } = useParams();
  const { search } = useLocation();
  const { employee } = useAuth();
  const client = useQueryClient();
  const allowed = employee?.permissions.includes('incidents.read') ?? false;
  const canManage = employee?.permissions.includes('incidents.manage') ?? false;
  const { detail, timeline } = useIncidentDetail(id, employee?.id, allowed);
  if (!allowed) return <Navigate to="/403" replace />;
  const status = isAxiosError(detail.error) ? detail.error.response?.status : undefined;
  if (status === 401) return <Navigate to="/login" replace />;
  if (status === 403) return <Navigate to="/403" replace />;
  if (detail.isPending) return <PanelSkeleton />;
  const incident = detail.data;
  if (!incident) return <section role="alert" className="space-y-4"><p>{status === 404 ? 'El incidente no existe o dejó de estar disponible.' : 'No se pudo consultar el expediente.'}</p><Button onClick={() => void detail.refetch()}>Reintentar</Button><Link className="block text-emerald-700 underline" to={`/incidents${search}`}>Volver a incidentes</Link></section>;
  const saved = () => {
    for (const queryKey of [['incident-detail', employee?.id, id], ['incident-events', employee?.id, id], ['incidents'], ['alerts'], ['dashboard-overview'], ['dashboard-activity'], ['attention-incidents'], ['historical-alerts']]) {
      void client.invalidateQueries({ queryKey });
    }
  };
  return <section className="space-y-6">
    <Link className="text-sm font-medium text-emerald-700 underline underline-offset-4" to={`/incidents${search}`}>Volver a incidentes</Link>
    <div><h1 className="text-2xl font-semibold">Expediente de incidente</h1><p className="mt-2 text-sm text-slate-600">{incident.title}</p><p className="mt-1 break-all text-xs text-slate-500">{incident.id} · versión {incident.version} · tramo {incident.occurrence}</p></div>
    {detail.isError && <p role="alert" className="rounded-lg border border-amber-200 p-3 text-sm">No se pudo actualizar. Se muestra la última información recibida; las acciones están suspendidas. <button className="underline" onClick={() => void detail.refetch()}>Reintentar</button></p>}
    {incident.legacyArchived && <p className="rounded-lg border p-3 text-sm">Registro histórico archivado al incorporar el flujo. No acredita un cierre manual ni una publicación verificada.</p>}
    <Card><CardHeader><CardTitle>Estado del expediente</CardTitle></CardHeader><CardContent>
      <dl className="grid gap-5 text-sm sm:grid-cols-2 lg:grid-cols-3">
        {[
          ['Servicio', incident.serviceKey], ['Atención', attentionLabels[incident.attentionState]],
          ['Condición técnica registrada', technicalLabels[incident.technicalStatus ?? ''] ?? 'Sin dato histórico'],
          ['Severidad', severityLabels[incident.severity] ?? incident.severity],
          ['Responsable', incident.assignee ? `${incident.assignee.firstName} ${incident.assignee.lastName}` : 'Sin asignar'],
          ['Reconocimiento', incident.acknowledgedAt ? date(incident.acknowledgedAt) : 'Pendiente'],
          ['Apertura (PET)', date(incident.openedAt)], ['Última observación (PET)', date(incident.lastObservedAt)],
          ['Recuperación confirmada (PET)', date(incident.resolvedAt)], [incident.legacyArchived ? 'Archivo histórico (PET)' : 'Cierre manual (PET)', date(incident.closedAt)],
        ].map(([label, value]) => <div key={label}><dt className="text-slate-500">{label}</dt><dd className="mt-1 font-medium">{value}</dd></div>)}
      </dl>
      {incident.previousIncidentId && <Link className="mt-4 block text-sm text-emerald-700 underline" to={`/incidents/${incident.previousIncidentId}${search}`}>Consultar incidente anterior relacionado</Link>}
      {incident.closingSummary && <p className="mt-4 whitespace-pre-wrap text-sm">Conclusión: {incident.closingSummary}</p>}
    </CardContent></Card>
    <div className="grid items-start gap-6 xl:grid-cols-2">
      <Card><CardHeader><CardTitle>Línea de tiempo</CardTitle></CardHeader><CardContent className="space-y-4">
        {timeline.isPending ? <PanelSkeleton /> : timeline.isError ? <p role="alert" className="text-sm">No se pudo consultar la línea de tiempo. <button className="underline" onClick={() => void timeline.refetch()}>Reintentar</button></p>
          : timeline.data?.pages.flatMap((page) => page.items).map((event) => <article key={event.id} className="border-b pb-4 last:border-0">
            <div className="flex flex-wrap justify-between gap-2 text-sm"><strong>{eventLabels[event.kind] ?? event.kind}</strong><span className="text-slate-500">v{event.version} · tramo {event.occurrence}</span></div>
            <p className="mt-1 text-xs text-slate-500">{date(event.createdAt)} PET · {event.origin === 'SYSTEM' ? 'Motor de monitoreo' : event.origin === 'IMPORT' ? 'Importación histórica' : event.actor ? `${event.actor.firstName} ${event.actor.lastName}` : 'Operador'}</p>
            <p className="mt-2 whitespace-pre-wrap text-sm">{event.reason}</p>{note(event.payload) && <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">{note(event.payload)}</p>}
          </article>)}
        {timeline.hasNextPage && <Button variant="outline" disabled={timeline.isFetchingNextPage} onClick={() => void timeline.fetchNextPage()}>{timeline.isFetchingNextPage ? 'Consultando…' : 'Ver eventos anteriores'}</Button>}
        {!timeline.isPending && !timeline.isError && !timeline.data?.pages[0].items.length && <p className="text-sm text-slate-600">Sin eventos registrados.</p>}
      </CardContent></Card>
      <div className="space-y-6">
        <IncidentPublications incidentId={incident.id} />
        {!incident.closedAt && <Card><CardHeader><CardTitle>Condiciones de cierre</CardTitle></CardHeader><CardContent>{incident.closureBlockers.length ? <ul className="list-disc space-y-2 pl-4 text-sm text-slate-600">{incident.closureBlockers.map((blocker) => <li key={blocker}>{blocker}</li>)}</ul> : <p className="text-sm">Las condiciones técnicas están completas. El cierre requiere resumen y confirmación del operador.</p>}</CardContent></Card>}
        {canManage && !incident.closedAt && !detail.isError && <Card><CardHeader><CardTitle>Atención</CardTitle></CardHeader><CardContent><IncidentActions key={incident.id} incident={incident} employeeId={employee!.id} onSaved={saved} /></CardContent></Card>}
        <Card><CardHeader><CardTitle>Evidencia técnica</CardTitle></CardHeader><CardContent className="space-y-3">{[['Afectación inicial', incident.evidence], ['Última observación', incident.lastEvidence], ['Recuperación', incident.recoveryEvidence]].map(([label, evidence]) => <details key={String(label)} className="rounded-lg border p-3 text-sm"><summary className="cursor-pointer">{String(label)}</summary><pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap break-words text-xs">{evidence ? JSON.stringify(evidence, null, 2) : 'Sin evidencia registrada'}</pre></details>)}</CardContent></Card>
      </div>
    </div>
  </section>;
}
