import { useQuery } from '@tanstack/react-query';
import { healthService } from '@/features/health/services/health.service';
import { HealthSkeleton } from '@/shared/components/loading/module-skeleton';
import { SectionHeading } from '@/shared/components/section-heading';

export function HealthPage() {
  const query = useQuery({ queryKey: ['health'], queryFn: healthService.check });
  if (query.isLoading) return <HealthSkeleton />;
  return <section><SectionHeading title="Salud de la plataforma" /><pre className="health-box">{query.isError ? 'Monitoring Backend no disponible' : JSON.stringify(query.data ?? { status: 'checking' }, null, 2)}</pre></section>;
}
