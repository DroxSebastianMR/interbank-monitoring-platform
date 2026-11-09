import { Check, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { attentionLabels, severityLabels } from '@/features/incidents/constants/incident-workflow';
import type { Notification } from '@/features/notifications/types/notification.types';

const services: Record<string, string> = {
  login: 'Inicio de sesión', balance: 'Consulta de saldo', transfers: 'Transferencias',
};
const events: Record<string, string> = {
  'incident.created': 'Incidente detectado', 'incident.updated': 'Actualización del incidente',
  'incident.resolved': 'Recuperación del servicio',
};
const dateFormat = new Intl.DateTimeFormat('es-PE', {
  timeZone: 'America/Lima', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
});
const label = (labels: Record<string, string>, value: string) => Object.hasOwn(labels, value) ? labels[value] : value;

export function NotificationItem({ item, pending, disabled, search, onRead, onNavigate }: {
  item: Notification; pending: boolean; disabled: boolean; search: string;
  onRead: (id: string) => void; onNavigate: () => void;
}) {
  const incident = item.incident;
  return <li className={`notification-item${item.readAt ? '' : ' is-unread'}`}>
    <div className="notification-item-heading"><h3>{Object.hasOwn(events, item.eventType) ? events[item.eventType] : 'Aviso del incidente'}</h3>
      <span className="notification-read-state">{item.readAt ? 'Leída' : 'Sin leer'}</span></div>
    <p className="notification-service">{incident ? label(services, incident.serviceKey) : 'Servicio no disponible'}</p>
    <p className="notification-description">{incident?.title ?? 'El expediente relacionado ya no está disponible.'}</p>
    {incident && <p className="notification-current-state">Estado actual: {label(attentionLabels, incident.attentionState)}
      {' · '}Severidad {label(severityLabels, incident.severity).toLowerCase()}</p>}
    <p className="notification-time"><time dateTime={item.createdAt} title={new Date(item.createdAt).toLocaleString('es-PE', { timeZone: 'America/Lima' })}>
      {dateFormat.format(new Date(item.createdAt))} PET</time></p>
    <div className="notification-item-actions">
      {incident && <Link to={{ pathname: `/incidents/${encodeURIComponent(incident.id)}`, search }} onClick={onNavigate}>
        Ver expediente <ExternalLink aria-hidden="true" /></Link>}
      {!item.readAt && <Button type="button" variant="ghost" size="sm" disabled={disabled} onClick={() => onRead(item.id)}>
        <Check aria-hidden="true" />{pending ? 'Guardando…' : 'Marcar como leída'}</Button>}
    </div>
  </li>;
}
