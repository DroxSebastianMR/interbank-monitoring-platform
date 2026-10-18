import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/app/providers/auth/use-auth';
import { useBankingAnalytics } from '@/features/analytics/hooks/use-banking-analytics';
import { PanelSkeleton } from '@/shared/components/loading/module-skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function AnalyticsPage() {
  const { employee } = useAuth();
  const allowed = ['analytics.read', 'transactions.read'].every((permission) => employee?.permissions.includes(permission));
  const query = useBankingAnalytics(employee?.id, allowed);
  const [date, setDate] = useState('');
  if (!allowed) return <Navigate to="/403" replace />;
  if (query.isPending) return <PanelSkeleton />;
  if (query.isError) return <section className="space-y-4 p-6" role="alert"><p>Analítica bancaria no disponible. Revisa la conexión interna y su token; no se muestran totales inventados.</p><Button onClick={() => void query.refetch()}>Reintentar</Button></section>;
  const data = query.data;
  const selected = date || data.today;
  const rows = data.buckets.filter((row) => row.date === selected);
  const hourly = Array.from({ length: 24 }, (_, hour) => ({ hour, total: rows.filter((row) => row.hour === hour).reduce((sum, row) => sum + row.count, 0) }));
  const peak = hourly.reduce((best, row) => row.total > best.total ? row : best, hourly[0]);
  return <section className="space-y-6">
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{[['Operaciones de hoy', data.summary.total], ['Completadas hoy', data.summary.completed], ['Día anterior completo', data.summary.previousTotal], ['Éxito persistido hoy', data.summary.successRate === null ? 'Sin datos' : `${(data.summary.successRate * 100).toFixed(1)} %`]].map(([label, value]) => <div className="rounded-xl border bg-white p-5" key={label}><p className="text-sm text-slate-600">{label}</p><p className="mt-2 text-2xl font-semibold">{value}</p></div>)}</div>
    <div className="flex flex-wrap items-end gap-4"><label className="space-y-2 text-sm">Fecha (Lima)<Input type="date" value={selected} max={data.today} onChange={(event) => setDate(event.target.value)} /></label><Button variant="outline" onClick={() => void query.refetch()}>Actualizar</Button><p className="text-sm text-slate-600">{peak.total ? `Hora pico: ${peak.hour}:00 · ${peak.total} operaciones` : 'Sin operaciones persistidas en esta fecha'}</p></div>
    <div className="overflow-x-auto rounded-xl border"><table className="w-full text-left text-sm"><caption className="p-3 text-left">Operaciones por hora, categoría y resultado persistido</caption><thead className="bg-slate-50"><tr>{['Hora PET', 'Categoría', 'Estado', 'Cantidad'].map((heading) => <th className="p-3" key={heading}>{heading}</th>)}</tr></thead><tbody>{rows.map((row) => <tr className="border-t" key={`${row.hour}-${row.category}-${row.status}`}><td className="p-3">{row.hour}:00</td><td className="p-3">{row.category}</td><td className="p-3">{row.status}</td><td className="p-3">{row.count}</td></tr>)}</tbody></table></div>
    <p className="text-sm leading-relaxed text-slate-600">Fuente: operaciones de PostgreSQL de los últimos 30 días. Plin se cuenta separado de otras transferencias, sin duplicar sus asientos. No incluye rechazos que no se guardaron ni atribuye operaciones a instancias. Hoy es un día parcial. Actualizado: {new Date(data.generatedAt).toLocaleString('es-PE', { timeZone: 'America/Lima' })} PET.</p>
  </section>;
}
