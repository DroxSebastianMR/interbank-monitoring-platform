import { useQuery } from '@tanstack/react-query';
import { healthService } from '@/features/health/services/health.service';

export function HealthPage() {
  const query = useQuery({ queryKey: ['health'], queryFn: healthService.check });
  return <section><div className="section-title"><h2>Salud de la plataforma</h2></div><pre className="health-box">{query.isError ? 'Monitoring Backend no disponible' : JSON.stringify(query.data ?? { status: 'checking' }, null, 2)}</pre></section>;
}
