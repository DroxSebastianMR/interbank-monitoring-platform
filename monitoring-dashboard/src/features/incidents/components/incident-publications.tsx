import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { useAuth } from '@/app/providers/auth/use-auth';
import { apiGet, apiPost } from '@/infrastructure/api/client/axios.instance';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const schema = z.object({ enabled: z.boolean(), items: z.array(z.object({ id: z.string().uuid(),
  sequence: z.number().int(), kind: z.string(), state: z.enum(['PENDING', 'PUBLISHED', 'SUPERSEDED']),
  attempts: z.number().int(), lastError: z.string().nullable(), title: z.string(), body: z.string(),
  publishedAt: z.string().nullable(), visibleAt: z.string().nullable(), nextAttemptAt: z.string(), createdAt: z.string(),
})).max(100) });
const states = { PENDING: 'Pendiente de publicación', PUBLISHED: 'Publicado', SUPERSEDED: 'Superado por información más reciente' };
const publicSite = import.meta.env.VITE_PUBLIC_STATUS_URL ?? 'http://localhost:5174/status';

export function IncidentPublications({ incidentId }: { incidentId: string }) {
  const { employee } = useAuth(); const client = useQueryClient();
  const allowed = employee?.permissions.includes('incidents.read') ?? false;
  const canRetry = employee?.permissions.includes('notifications.manage') ?? false;
  const key = ['incident-publications', employee?.id, incidentId];
  const query = useQuery({ queryKey: key, enabled: allowed, refetchInterval: 10_000, retry: false,
    queryFn: async () => schema.parse(await apiGet<unknown>(`/status-publications?incidentId=${encodeURIComponent(incidentId)}`)) });
  const retry = useMutation({ mutationFn: (id: string) => apiPost(`/status-publications/${encodeURIComponent(id)}/retry`),
    onSuccess: () => { void client.invalidateQueries({ queryKey: key }); } });
  if (!allowed) return null;
  return <Card><CardHeader><CardTitle>Comunicaciones públicas</CardTitle></CardHeader><CardContent className="space-y-4">
    {query.isPending ? <p className="text-sm">Consultando comunicaciones…</p> : query.isError ? <p role="alert" className="text-sm">No se pudieron consultar los intentos. <button className="underline" onClick={() => void query.refetch()}>Reintentar</button></p> : <>
      {!query.data.enabled && <p className="text-sm text-amber-800">La publicación pública está deshabilitada en este entorno.</p>}
      {!query.data.items.length && <p className="text-sm text-slate-600">No hay comunicaciones registradas para este expediente.</p>}
      {query.data.items.map((item) => <article key={item.id} className="border-b pb-3 text-sm last:border-0">
        <strong>{item.title}</strong><p className="mt-1 text-slate-600">{item.body}</p>
        <p className="mt-2">{states[item.state]} · secuencia {item.sequence} · intentos {item.attempts}</p>
        {item.lastError && <p className="mt-1 text-xs text-amber-800">{item.lastError === 'SOURCE_NO_RECENT_DATA' ? 'Se esperan observaciones recientes.' : 'Hay una verificación o un reintento pendiente.'}</p>}
        {item.visibleAt && <p className="mt-1 text-xs text-slate-500">Disponible mediante API pública: {new Date(item.visibleAt).toLocaleString('es-PE', { timeZone: 'America/Lima' })} PET</p>}
        {item.state === 'PUBLISHED' && <a className="mt-2 block text-emerald-700 underline" target="_blank" rel="noreferrer" href={`${publicSite}${publicSite.includes('?') ? '&' : '?'}notice=${item.id}`}>Consultar aviso público</a>}
        {canRetry && item.state === 'PENDING' && query.data?.enabled && <Button className="mt-2" size="sm" variant="outline" disabled={retry.isPending} onClick={() => retry.mutate(item.id)}>Adelantar reintento</Button>}
      </article>)}
      {retry.isError && <p role="alert" className="text-sm">No se pudo programar el reintento. El aviso conserva su registro.</p>}
    </>}
  </CardContent></Card>;
}
