import { useState } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/app/providers/auth/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useOperationalHistory } from '@/features/incidents/hooks/use-operational-history';
import { PanelSkeleton } from '@/shared/components/loading/module-skeleton';

export function OperationalHistory({ kind }: { kind: 'incidents' | 'alerts' }) {
  const { employee } = useAuth();
  const allowed = employee?.permissions.includes(`${kind}.read`) ?? false;
  const [params, setParams] = useSearchParams();
  const activeOnly = kind === 'incidents' && params.get('status') === 'active';
  const pendingOnly = kind === 'alerts' && params.get('status') === 'pending';
  const reference = params.get('reference');
  const selectedService = kind === 'incidents' ? params.get('service') : null;
  const query = useOperationalHistory(employee?.id, kind, allowed && !pendingOnly);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  if (!allowed) return <Navigate to="/403" replace />;
  if (pendingOnly) return <section className="space-y-4 p-6" aria-label="Alertas pendientes">
    <h2 className="text-lg font-semibold">Alertas pendientes</h2>
    <p>No se puede determinar cuáles están pendientes: el Monitoring Backend no registra reconocimiento ni prioridad de alertas. Las alertas recuperadas y el historial no se cuentan como pendientes.</p>
    <Button variant="outline" onClick={() => setParams((current) => { const next = new URLSearchParams(current); next.delete('status'); return next; })}>Abrir historial de alertas</Button>
  </section>;
  if (query.isPending) return <PanelSkeleton />;
  if (query.isError) return <div role="alert" className="space-y-4 p-6"><p>No se pudo consultar el historial. No se interpreta como ausencia de incidentes.</p><Button onClick={() => void query.refetch()}>Reintentar</Button></div>;
  const rows = query.data.filter((row) => (!activeOnly || row.resolvedAt === null) && (!reference || row.id === reference) && (!selectedService || row.category === selectedService) && `${row.title} ${row.category} ${row.status} ${row.severity}`.toLocaleLowerCase().includes(search.toLocaleLowerCase()));
  const pages = Math.max(1, Math.ceil(rows.length / 20));
  const current = Math.min(page, pages);
  return <section className="space-y-5" aria-label={kind === 'incidents' ? 'Historial de incidentes' : 'Historial de alertas'}>
    {reference && <p className="text-sm text-slate-600">Referencia seleccionada: {reference} <Button variant="outline" onClick={() => { setPage(1); setParams((current) => { const next = new URLSearchParams(current); next.delete('reference'); return next; }); }}>Ver todas las referencias</Button></p>}
    {activeOnly && <p className="text-sm text-slate-600">Filtro: incidentes abiertos entre los últimos 100 registros. El contador global puede incluir incidentes anteriores. <Button variant="outline" onClick={() => { setPage(1); setParams((current) => { const next = new URLSearchParams(current); next.delete('status'); return next; }); }}>Ver historial completo</Button></p>}
    <div className="flex flex-wrap items-center gap-3"><Input className="max-w-md" aria-label="Buscar en el historial" placeholder="Buscar servicio, estado o mensaje…" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} /><Button variant="outline" disabled={query.isFetching} onClick={() => void query.refetch()}>Actualizar</Button></div>
    <p className="text-sm text-slate-600">Últimos 100 registros persistidos. Horarios de Lima. {kind === 'alerts' && 'Este historial no confirma entrega de notificaciones push.'}</p>
    {!rows.length ? <p className="rounded-xl border p-6">Sin registros para este filtro.</p> : <div className="overflow-x-auto rounded-xl border"><table className="w-full text-left text-sm"><thead className="bg-slate-50"><tr>{['Fecha (PET)', 'Servicio / tipo', 'Descripción', 'Estado', 'Detalle'].map((label) => <th className="p-3" key={label}>{label}</th>)}</tr></thead><tbody>{rows.slice((current - 1) * 20, current * 20).map((row) => <tr key={row.id} className="border-t align-top"><td className="whitespace-nowrap p-3">{new Date(row.date).toLocaleString('es-PE', { timeZone: 'America/Lima' })}</td><td className="p-3">{row.category}</td><td className="max-w-lg p-3">{row.title}</td><td className="p-3"><span className={row.status === 'RESOLVED' || row.status === 'RECOVERY' ? 'text-emerald-700' : 'text-amber-800'}>{row.status} {row.severity}</span></td><td className="p-3"><details><summary className="cursor-pointer">Ver referencia</summary><p className="mt-2 break-all">Incidente: {row.reference}</p>{row.resolvedAt && <p>Resuelto: {new Date(row.resolvedAt).toLocaleString('es-PE', { timeZone: 'America/Lima' })}</p>}</details></td></tr>)}</tbody></table></div>}
    <div className="flex items-center justify-end gap-3"><Button variant="outline" disabled={current === 1} onClick={() => setPage(current - 1)}>Anterior</Button><span>{current} / {pages}</span><Button variant="outline" disabled={current === pages} onClick={() => setPage(current + 1)}>Siguiente</Button></div>
  </section>;
}
