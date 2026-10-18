import { useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CircleCheck,
  Pause,
  Play,
  RefreshCw,
  Save,
  Settings2,
  TriangleAlert,
} from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { servicesService } from '@/features/services/services/services.service';
import { CRITICALITY_LABELS, CRITICALITY_OPTIONS } from '@/features/services/constants/service.constants';
import type { MonitoredService } from '@/features/services/types/service.types';

type ServiceActionKind = 'pause' | 'resume' | 'check';

export function ServiceActions({ service }: { service: MonitoredService }) {
  const queryClient = useQueryClient();
  const [pauseOpen, setPauseOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [pauseReason, setPauseReason] = useState('');
  const [editReason, setEditReason] = useState('');
  const [name, setName] = useState(service.name);
  const [endpoint, setEndpoint] = useState(service.path ?? '');
  const [criticality, setCriticality] = useState(service.criticality ?? 'HIGH');
  const [feedback, setFeedback] = useState<string | null>(null);

  const invalidate = () => {
    for (const queryKey of [
      ['monitored-service', service.id],
      ['monitored-service-checks', service.id],
      ['monitored-service-state-history', service.id],
      ['monitored-service-config-history', service.id],
      ['monitored-services'],
      ['dashboard-overview'],
    ]) void queryClient.invalidateQueries({ queryKey });
  };

  const action = useMutation({
    mutationFn: (kind: ServiceActionKind) =>
      kind === 'pause'
        ? servicesService.pause(service.id, pauseReason)
        : kind === 'resume'
          ? servicesService.resume(service.id)
          : servicesService.check(service.id),
    onMutate: () => setFeedback(null),
    onSuccess: (_, kind) => {
      invalidate();
      if (kind === 'pause') {
        setPauseOpen(false);
        setPauseReason('');
        setFeedback('La supervisión automática fue pausada.');
      } else if (kind === 'resume') {
        setFeedback('La supervisión automática fue reanudada.');
      } else {
        setFeedback('La comprobación manual finalizó correctamente.');
      }
    },
  });

  const update = useMutation({
    mutationFn: () => servicesService.update(service.id, {
      name,
      endpoint,
      criticality,
      expectedVersion: service.version ?? 1,
      reason: editReason,
    }),
    onMutate: () => setFeedback(null),
    onSuccess: () => {
      invalidate();
      setEditOpen(false);
      setEditReason('');
      setFeedback('La configuración del servicio fue actualizada.');
    },
  });

  function openEditDialog() {
    setName(service.name);
    setEndpoint(service.path ?? '');
    setCriticality(service.criticality ?? 'HIGH');
    setEditReason('');
    update.reset();
    setEditOpen(true);
  }

  function submitEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    update.mutate();
  }

  const isCheckPending = action.isPending && action.variables === 'check';
  const isResumePending = action.isPending && action.variables === 'resume';
  const isPausePending = action.isPending && action.variables === 'pause';

  return (
    <Card className="service-actions-card">
      <CardHeader className="service-actions-header">
        <div>
          <CardTitle>Acciones autorizadas</CardTitle>
          <CardDescription>
            Ejecuta comprobaciones o administra la supervisión de este servicio.
          </CardDescription>
        </div>
        <Badge className="service-actions-access" variant="secondary">
          Acceso administrativo
        </Badge>
      </CardHeader>

      <CardContent className="service-actions-content">
        <div className="service-actions-toolbar" aria-label="Acciones disponibles">
          <Button
            type="button"
            className="service-action-button is-primary"
            disabled={action.isPending || service.monitoringEnabled === false}
            onClick={() => action.mutate('check')}
          >
            <RefreshCw className={isCheckPending ? 'spin' : undefined} aria-hidden="true" />
            {isCheckPending ? 'Comprobando…' : 'Comprobar ahora'}
          </Button>

          {service.monitoringEnabled === false ? (
            <Button
              type="button"
              className="service-action-button is-resume"
              variant="outline"
              disabled={action.isPending}
              onClick={() => action.mutate('resume')}
            >
              <Play aria-hidden="true" />
              {isResumePending ? 'Reanudando…' : 'Reanudar supervisión'}
            </Button>
          ) : (
            <Button
              type="button"
              className="service-action-button is-pause"
              variant="outline"
              disabled={action.isPending}
              onClick={() => {
                action.reset();
                setPauseOpen(true);
              }}
            >
              <Pause aria-hidden="true" />
              Pausar supervisión
            </Button>
          )}

          <Button
            type="button"
            className="service-action-button is-edit"
            variant="outline"
            disabled={action.isPending || update.isPending}
            onClick={openEditDialog}
          >
            <Settings2 aria-hidden="true" />
            Editar configuración
          </Button>
        </div>

        {feedback && (
          <Alert className="service-action-feedback is-success">
            <CircleCheck aria-hidden="true" />
            <AlertTitle>Acción completada</AlertTitle>
            <AlertDescription>{feedback}</AlertDescription>
          </Alert>
        )}

        {action.isError && !pauseOpen && (
          <Alert className="service-action-feedback" variant="destructive">
            <TriangleAlert aria-hidden="true" />
            <AlertTitle>No se pudo completar la acción</AlertTitle>
            <AlertDescription>Comprueba tus permisos y la conexión con el servicio.</AlertDescription>
          </Alert>
        )}
      </CardContent>

      <Dialog open={pauseOpen} onOpenChange={(open) => !isPausePending && setPauseOpen(open)}>
        <DialogContent className="service-action-dialog" showCloseButton={!isPausePending}>
          <DialogHeader className="service-action-dialog-header">
            <div className="service-action-dialog-icon is-warning" aria-hidden="true"><Pause /></div>
            <div>
              <DialogTitle>Pausar supervisión</DialogTitle>
              <DialogDescription>
                Se detendrán las comprobaciones automáticas de {service.name} hasta que las reanudes.
              </DialogDescription>
            </div>
          </DialogHeader>
          <div className="service-action-form-field">
            <Label htmlFor="pause-reason">Motivo de la pausa</Label>
            <Textarea
              id="pause-reason"
              value={pauseReason}
              onChange={(event) => setPauseReason(event.target.value)}
              maxLength={500}
              placeholder="Describe brevemente por qué se pausará la supervisión"
              disabled={isPausePending}
            />
            <small>{pauseReason.length} de 500 caracteres</small>
          </div>
          {action.isError && (
            <Alert variant="destructive">
              <TriangleAlert aria-hidden="true" />
              <AlertTitle>No se pudo pausar</AlertTitle>
              <AlertDescription>Comprueba los permisos y vuelve a intentarlo.</AlertDescription>
            </Alert>
          )}
          <DialogFooter className="service-action-dialog-footer">
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isPausePending}>Cancelar</Button>
            </DialogClose>
            <Button
              type="button"
              className="service-dialog-confirm is-warning"
              disabled={isPausePending || !pauseReason.trim()}
              onClick={() => action.mutate('pause')}
            >
              <Pause aria-hidden="true" />
              {isPausePending ? 'Pausando…' : 'Confirmar pausa'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={(open) => !update.isPending && setEditOpen(open)}>
        <DialogContent className="service-action-dialog service-edit-dialog" showCloseButton={!update.isPending}>
          <form onSubmit={submitEdit}>
            <DialogHeader className="service-action-dialog-header">
              <div className="service-action-dialog-icon" aria-hidden="true"><Settings2 /></div>
              <div>
                <DialogTitle>Editar configuración</DialogTitle>
                <DialogDescription>
                  Actualiza los datos de supervisión. El cambio quedará registrado en el historial.
                </DialogDescription>
              </div>
            </DialogHeader>
            <div className="service-edit-grid">
              <div className="service-action-form-field">
                <Label htmlFor="edit-service-name">Nombre</Label>
                <Input
                  id="edit-service-name"
                  required
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  disabled={update.isPending}
                />
              </div>
              <div className="service-action-form-field">
                <Label htmlFor="edit-service-endpoint">Ruta de salud</Label>
                <Input
                  id="edit-service-endpoint"
                  required
                  placeholder="/auth/health"
                  value={endpoint}
                  onChange={(event) => setEndpoint(event.target.value)}
                  disabled={update.isPending}
                />
              </div>
              <div className="service-action-form-field">
                <Label htmlFor="edit-service-criticality">Criticidad</Label>
                <Select value={criticality} onValueChange={setCriticality} disabled={update.isPending}>
                  <SelectTrigger id="edit-service-criticality">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    <SelectGroup>
                      {CRITICALITY_OPTIONS.map((value) => (
                        <SelectItem key={value} value={value}>{CRITICALITY_LABELS[value]}</SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              <div className="service-action-form-field is-full">
                <Label htmlFor="edit-reason">Motivo del cambio</Label>
                <Textarea
                  id="edit-reason"
                  required
                  value={editReason}
                  onChange={(event) => setEditReason(event.target.value)}
                  maxLength={500}
                  placeholder="Explica la razón de esta modificación"
                  disabled={update.isPending}
                />
                <small>{editReason.length} de 500 caracteres</small>
              </div>
            </div>
            {update.isError && (
              <Alert className="service-edit-alert" variant="destructive">
                <TriangleAlert aria-hidden="true" />
                <AlertTitle>No se pudieron guardar los cambios</AlertTitle>
                <AlertDescription>Comprueba la versión del servicio, tus permisos y la conexión.</AlertDescription>
              </Alert>
            )}
            <DialogFooter className="service-action-dialog-footer">
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={update.isPending}>Cancelar</Button>
              </DialogClose>
              <Button type="submit" className="service-dialog-confirm" disabled={update.isPending || !editReason.trim()}>
                <Save aria-hidden="true" />
                {update.isPending ? 'Guardando…' : 'Guardar cambios'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
