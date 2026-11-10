import { useState, type FormEvent } from 'react';
import { useMutation } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { useAuth } from '@/app/providers/auth/use-auth';
import { apiPost } from '@/infrastructure/api/client/axios.instance';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import type { MonitoredService } from '@/features/services/types/service.types';

type Approval = { serviceKey: string; expectedServiceVersion: number; commandId: string; reason: string };
export function PublicNoticeApproval({ service }: { service: MonitoredService }) {
  const { employee } = useAuth();
  const [reason, setReason] = useState('');
  const [pending, setPending] = useState<Approval | null>(null);
  const [feedback, setFeedback] = useState('');
  const mutation = useMutation({ mutationFn: (body: Approval) => apiPost('/status-publications/preventive', body), retry: false,
    onSuccess: () => { setPending(null); setReason(''); setFeedback('Autorización registrada. El aviso se publicará si las condiciones siguen siendo válidas.'); },
    onError: (error, body) => {
      const status = isAxiosError(error) ? error.response?.status : undefined;
      if (!status || status >= 500) { setPending(body); setFeedback('No se pudo confirmar el resultado. Reintenta la misma autorización.'); }
      else { setPending(null); const data = isAxiosError(error) ? error.response?.data as { message?: unknown } : undefined;
        setFeedback(typeof data?.message === 'string' ? data.message : 'No se pudo autorizar el aviso.'); }
    } });
  if (!employee?.permissions.includes('notifications.manage') || !employee.permissions.includes('services.read') ||
    service.status !== 'OPERATIONAL' || service.riskLevel !== 'HIGH') return null;
  const submit = (event: FormEvent) => {
    event.preventDefault();
    mutation.mutate(pending ?? { serviceKey: service.id, expectedServiceVersion: service.version ?? 1, commandId: crypto.randomUUID(), reason: reason.trim() });
  };
  return <Dialog><DialogTrigger asChild><Button variant="outline">Autorizar aviso preventivo</Button></DialogTrigger>
    <DialogContent><DialogHeader><DialogTitle>Aviso preventivo público</DialogTitle><DialogDescription>Publicará un texto estándar de posibilidad si el riesgo alto sigue vigente. No confirma una interrupción ni modifica el estado del servicio.</DialogDescription></DialogHeader>
      <form className="space-y-4" onSubmit={submit}><div className="space-y-2"><Label htmlFor="preventive-reason">Motivo de autorización (uso interno)</Label><Textarea id="preventive-reason" required maxLength={500} value={reason} disabled={!!pending || mutation.isPending} onChange={(event) => setReason(event.target.value)} /></div>
        <Button disabled={mutation.isPending || (!pending && !reason.trim())} type="submit">{mutation.isPending ? 'Registrando…' : pending ? 'Reintentar misma autorización' : 'Autorizar aviso'}</Button>
        {feedback && <p role="status" className="text-sm">{feedback}</p>}
      </form>
    </DialogContent>
  </Dialog>;
}
