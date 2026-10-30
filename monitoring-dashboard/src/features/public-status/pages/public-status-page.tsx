import { useEffect, useRef, useState } from 'react';
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { publicStatusService, type PublicNotice } from '@/features/public-status/services/public-status.service';
import './public-status.css';

const labels: Record<string, string> = { OPERATIONAL: 'Operativo', DEGRADED: 'Degradado', UNAVAILABLE: 'No disponible', NO_DATA: 'Sin datos recientes' };
const icons: Record<string, string> = { OPERATIONAL: '✓', DEGRADED: '!', UNAVAILABLE: '×', NO_DATA: '?' };
const time = (value: string | null) => value ? new Date(value).toLocaleString('es-PE', { timeZone: 'America/Lima' }) : 'Sin observaciones recibidas';

function Notice({ item, now }: { item: PublicNotice; now: number }) {
  return <article className="public-notice">
    <p className="public-notice-time"><time dateTime={item.publishedAt}>{time(item.publishedAt)} PET</time>
      {item.kind === 'PREVENTIVE' && item.expiresAt && Date.parse(item.expiresAt) <= now ? ' · Aviso preventivo vencido' : ''}</p>
    <h3>{item.title}</h3><p>{item.body}</p>
  </article>;
}

export function PublicStatusPage() {
  const [params, setParams] = useSearchParams();
  const service = params.get('service') ?? '';
  const selectedNotice = params.get('notice') ?? '';
  const [now, setNow] = useState(Date.now);
  const [online, setOnline] = useState(navigator.onLine);
  const client = useQueryClient();
  const previousRevision = useRef('');
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener('online', update); window.addEventListener('offline', update);
    const timer = window.setInterval(() => setNow(Date.now()), 5000);
    return () => { window.clearInterval(timer); window.removeEventListener('online', update); window.removeEventListener('offline', update); };
  }, []);
  const snapshot = useQuery({ queryKey: ['public-status'], queryFn: ({ signal }) => publicStatusService.snapshot(signal), refetchInterval: 10_000 });
  const history = useInfiniteQuery({ queryKey: ['public-status-history', service], initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam, signal }) => publicStatusService.history(service, pageParam, signal),
    getNextPageParam: (last) => last.nextCursor ?? undefined });
  const notice = useQuery({ queryKey: ['public-status-notice', selectedNotice],
    queryFn: ({ signal }) => publicStatusService.notice(selectedNotice, signal), enabled: !!selectedNotice });
  const revision = snapshot.data?.services.map((item) => item.lastNotice?.id ?? '').join(':') ?? '';
  useEffect(() => {
    if (previousRevision.current && previousRevision.current !== revision) {
      void client.invalidateQueries({ queryKey: ['public-status-history'] });
    }
    previousRevision.current = revision;
  }, [revision, client]);
  const disconnected = !online || snapshot.isError;
  const services = snapshot.data?.services.filter((item) => !service || item.serviceKey === service) ?? [];
  const currentServices = services.map((item) => {
    const age = item.lastObservationAt ? now - Date.parse(item.lastObservationAt) : Infinity;
    return { ...item, currentStatus: disconnected || age < 0 || age > item.observationMaxAgeMs ? 'NO_DATA' : item.status };
  });
  const allHealthy = currentServices.length > 0 && currentServices.every((item) => item.currentStatus === 'OPERATIONAL');
  const unknownService = !!service && !!snapshot.data && !services.length;

  return <div className="public-status-shell">
    <header className="public-status-header"><span className="public-lab-label">Laboratorio · Servicios ficticios</span>
      <h1>Estado de los servicios</h1><p>Disponibilidad, afectaciones y avisos de restablecimiento.</p>
    </header>
    <main className="public-status-main">
      <section className="public-status-summary" role="status" aria-live="polite">
        <h2>{disconnected ? 'No se puede comprobar el estado actual.' : snapshot.isPending ? 'Consultando el estado de los servicios…' : allHealthy ? 'Los servicios consultados están operativos.' : 'Consulta el estado de cada servicio.'}</h2>
        <p>{disconnected ? 'Se conserva la última información recibida. No confirma el estado actual de los servicios.' : 'La información se actualiza automáticamente. No necesitas iniciar sesión.'}</p>
        {snapshot.data && <p className="public-status-date">Última consulta al monitor: {time(snapshot.data.generatedAt)} PET</p>}
        {disconnected && <Button variant="outline" disabled={snapshot.isFetching} onClick={() => void snapshot.refetch()}>Reintentar consulta</Button>}
      </section>
      <label className="public-service-filter">Servicio<select value={service} onChange={(event) => {
        const next = new URLSearchParams(params); next.delete('notice');
        if (event.target.value) next.set('service', event.target.value); else next.delete('service'); setParams(next);
      }}><option value="">Todos los servicios</option>{unknownService && <option value={service}>Servicio no disponible</option>}{snapshot.data?.services.map((item) => <option key={item.serviceKey} value={item.serviceKey}>{item.name}</option>)}</select></label>
      {unknownService && <p role="alert">El servicio solicitado no forma parte del catálogo público.</p>}
      <section className="public-service-grid" aria-label="Estado por servicio">
        {snapshot.isPending && !snapshot.data && [0, 1, 2].map((item) => <div key={item} className="public-status-skeleton" aria-hidden="true" />)}
        {currentServices.map((item) => <Card key={item.serviceKey}><CardHeader><CardTitle>{item.name}</CardTitle></CardHeader><CardContent>
          <p className={`public-service-state is-${item.currentStatus.toLowerCase()}`}><span aria-hidden="true">{icons[item.currentStatus]}</span>{labels[item.currentStatus]}</p>
          <p className="public-status-date">Última observación: {time(item.lastObservationAt)}{item.lastObservationAt ? ' PET' : ''}</p>
          {item.currentStatus === 'NO_DATA' && item.lastKnownStatus && <p className="public-status-date">Último estado publicado: {labels[item.lastKnownStatus]}. No confirma el estado actual.</p>}
          {item.lastNotice && <div className="public-last-notice"><strong>Último aviso publicado</strong><p className="public-status-date">{time(item.lastNotice.publishedAt)} PET</p><p>{item.lastNotice.body}</p></div>}
        </CardContent></Card>)}
      </section>
      {selectedNotice && <Card><CardHeader><CardTitle>Aviso seleccionado</CardTitle></CardHeader><CardContent>
        {notice.isPending ? <p>Consultando aviso…</p> : notice.isError ? <p role="alert">No se pudo consultar este aviso público.</p> : notice.data ? <Notice item={notice.data} now={now} /> : null}
        <button className="public-text-link" onClick={() => { const next = new URLSearchParams(params); next.delete('notice'); setParams(next); }}>Volver al historial</button>
      </CardContent></Card>}
      <Card><CardHeader><CardTitle>Avisos publicados</CardTitle></CardHeader><CardContent>
        {history.isPending ? <p>Consultando avisos…</p> : history.isError ? <p role="alert">No se pudo actualizar el historial. <button className="public-text-link" onClick={() => void history.refetch()}>Reintentar</button></p> : !history.data?.pages[0].items.length ? <p>No hay avisos publicados para esta consulta.</p> : null}
        {history.data?.pages.flatMap((page) => page.items).map((item) => <Notice key={item.id} item={item} now={now} />)}
        {history.hasNextPage && <Button variant="outline" disabled={history.isFetchingNextPage} onClick={() => void history.fetchNextPage()}>{history.isFetchingNextPage ? 'Consultando…' : 'Ver avisos anteriores'}</Button>}
      </CardContent></Card>
    </main>
    <footer className="public-status-footer">Entorno de demostración. No procesa dinero real ni representa el estado productivo de Interbank. Los avisos no confirman el resultado de una operación particular.</footer>
  </div>;
}
