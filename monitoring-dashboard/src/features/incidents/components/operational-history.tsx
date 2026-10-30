import { useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { attentionLabels, severityLabels } from '@/features/incidents/constants/incident-workflow';
import { useAuth } from '@/app/providers/auth/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useOperationalHistory } from '@/features/incidents/hooks/use-operational-history';
import { PanelSkeleton } from '@/shared/components/loading/module-skeleton';

export function OperationalHistory({ kind }: { kind: 'incidents' | 'alerts' }) {
  const { search: contextSearch } = useLocation();
  const { employee } = useAuth();
  const allowed = employee?.permissions.includes(`${kind}.read`) ?? false;
  const query = useOperationalHistory(employee?.id, kind, allowed);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  if (!allowed) return <Navigate to="/403" replace />;
  if (query.isPending) return <PanelSkeleton />;
  if (query.isError) return <div role="alert" className="space-y-4 p-6"><p>No se pudo consultar el historial. No se interpreta como ausencia de incidentes.</p><Button onClick={() => void query.refetch()}>Reintentar</Button></div>;
  const rows = query.data.filter((row) => `${row.title} ${row.category} ${row.status} ${row.severity} ${row.owner ?? ""}`.toLocaleLowerCase().includes(search.toLocaleLowerCase()));
  const pages = Math.max(1, Math.ceil(rows.length / 20));
  const current = Math.min(page, pages);
  return <section className="space-y-5" aria-label={kind === 'incidents' ? 'Historial de incidentes' : 'Historial de alertas'}>
    <div className="flex flex-wrap items-center gap-3"><Input className="max-w-md" aria-label="Buscar en el historial" placeholder="Buscar servicio, estado o mensaje…" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} /><Button variant="outline" disabled={query.isFetching} onClick={() => void query.refetch()}>Actualizar</Button></div>
    <p className="text-sm text-slate-600">{kind === 'incidents' ? 'Hasta 100 expedientes; primero los pendientes de cierre.' : 'Últimos 100 registros persistidos.'} Horarios de Lima. {kind === 'alerts' && 'Este historial no confirma entrega de notificaciones push.'}</p>
    {!rows.length ? <p className="rounded-xl border p-6">Sin registros para este filtro.</p> : <div className="overflow-x-auto rounded-xl border"><table className="w-full text-left text-sm"><thead className="bg-slate-50"><tr>{['Fecha (PET)', 'Servicio / tipo', 'Descripción', 'Estado', ...(kind === 'incidents' ? ['Responsable'] : []), 'Detalle'].map((label) => <th className="p-3" key={label}>{label}</th>)}</tr></thead><tbody>{rows.slice((current - 1) * 20, current * 20).map((row) => <tr key={row.id} className="border-t align-top"><td className="whitespace-nowrap p-3">{new Date(row.date).toLocaleString('es-PE', { timeZone: 'America/Lima' })}</td><td className="p-3">{row.category}</td><td className="max-w-lg p-3">{row.title}</td><td className="p-3"><span className={row.status === 'RESOLVED' || row.status === 'CLOSED' || row.status === 'RECOVERY' ? 'text-emerald-700' : 'text-amber-800'}>{kind === 'incidents' ? attentionLabels[row.status] ?? row.status : row.status} {severityLabels[row.severity] ?? row.severity}</span></td>{kind === 'incidents' && <td className="p-3">{row.owner ?? 'Sin asignar'}</td>}<td className="p-3">{employee?.permissions.includes('incidents.read') && <Link className="text-emerald-700 underline underline-offset-4" to={`/incidents/${row.reference}${contextSearch}`}>Ver expediente</Link>}<details><summary className="cursor-pointer">Ver referencia</summary><p className="mt-2 break-all">Incidente: {row.reference}</p>{row.resolvedAt && <p>Resuelto: {new Date(row.resolvedAt).toLocaleString('es-PE', { timeZone: 'America/Lima' })}</p>}</details></td></tr>)}</tbody></table></div>}
    <div className="flex items-center justify-end gap-3"><Button variant="outline" disabled={current === 1} onClick={() => setPage(current - 1)}>Anterior</Button><span>{current} / {pages}</span><Button variant="outline" disabled={current === pages} onClick={() => setPage(current + 1)}>Siguiente</Button></div>
  </section>;
}
