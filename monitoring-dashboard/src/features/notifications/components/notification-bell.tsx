import { useId, useState } from 'react';
import { Bell, X } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/app/providers/auth/use-auth';
import { Button } from '@/components/ui/button';
import { Popover, PopoverClose, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { PermissionCode } from '@/features/auth/enums/permission-code.enum';
import { useNotifications } from '@/features/notifications/hooks/use-notifications';
import { notificationAccessBlocked, notificationError, notificationErrorMessages } from '@/features/notifications/utils/notification-error';
import { NotificationItem } from '@/features/notifications/components/notification-item';
import './notifications.css';

export function NotificationBell() {
  const { employee } = useAuth();
  if (!employee || ![PermissionCode.NOTIFICATIONS_READ, PermissionCode.INCIDENTS_READ].every((code) => employee.permissions.includes(code))) return null;
  return <EmployeeNotifications key={`${employee.id}:${employee.permissions.join(',')}`} employeeId={employee.id} />;
}

function EmployeeNotifications({ employeeId }: { employeeId: string }) {
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const { search } = useLocation();
  const { count, inbox, read, online, refresh } = useNotifications(employeeId, open);
  const kind = notificationError(count.error) ?? notificationError(inbox.error);
  const blocked = notificationAccessBlocked(count.error) || notificationAccessBlocked(inbox.error);
  const countCurrent = online && !count.isError && !blocked && count.data !== undefined;
  const unreadCount = count.data?.unreadCount;
  const summary = countCurrent ? `${unreadCount} sin leer` : !online ? 'Sin conexión' : count.isError || blocked ? 'Conteo no disponible' : 'Consultando…';
  const items = [...new Map(inbox.data?.pages.flatMap((page) => page.items).map((item) => [item.id, item] as const) ?? []).values()];
  const lastUpdate = inbox.dataUpdatedAt || count.dataUpdatedAt;
  const olderWindow = inbox.data?.pageParams[0] !== undefined;
  const disabled = !online || blocked || inbox.isError || count.isError || read.isPending;
  const busy = inbox.isFetching || count.isFetching;
  const changeOpen = (value: boolean) => {
    setOpen(value);
    if (value && notificationAccessBlocked(count.error) && online) void count.refetch();
    if (!value && !read.isPending) read.reset();
  };

  return <Popover open={open} onOpenChange={changeOpen}>
    <PopoverTrigger asChild><Button type="button" variant="ghost" size="icon" className="notification-trigger"
      aria-label={`Notificaciones: ${summary}`} title={`Notificaciones: ${summary}`}>
      <Bell aria-hidden="true" />
      {!countCurrent ? <span className="notification-count is-unknown" aria-hidden="true">{count.isPending && online ? '…' : '!'}</span>
        : unreadCount !== undefined && unreadCount > 0 && <span className="notification-count" aria-hidden="true">{unreadCount > 99 ? '99+' : unreadCount}</span>}
    </Button></PopoverTrigger>
    <PopoverContent className="notification-panel" aria-labelledby={titleId}>
      <div className="notification-panel-header"><div><h2 id={titleId}>Notificaciones</h2><p role="status" aria-live="polite">{summary}</p></div>
        <PopoverClose asChild><Button type="button" variant="ghost" size="icon" aria-label="Cerrar notificaciones"><X aria-hidden="true" /></Button></PopoverClose>
      </div>
      <div className="notification-panel-scroll" tabIndex={0} role="region" aria-label="Contenido de notificaciones">
        {!online && <p className="notification-feedback" role="status">Sin conexión. Se conserva la última información recibida.</p>}
        {kind && <div className="notification-feedback" role="alert"><p>{notificationErrorMessages[kind]}</p>
          {online && <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => void refresh()}>Reintentar</Button>}</div>}
        {(!count.data || inbox.isPending) && !kind && online && <div className="notification-loading" role="status">
          <span>Cargando notificaciones…</span>{[0, 1, 2].map((item) => <div key={item} className="notification-skeleton" aria-hidden="true" />)}
        </div>}
        {read.isError && <p className="notification-feedback" role="alert">No se pudo confirmar la lectura. Puedes reintentar; la operación no duplica notificaciones.</p>}
        {read.isSuccess && <p className="notification-feedback is-success" role="status">Notificación marcada como leída.</p>}
        {!blocked && <>
          {olderWindow && <div className="notification-history-hint"><span>Estás consultando notificaciones anteriores.</span>
            <Button type="button" size="sm" variant="outline" disabled={!online || busy} onClick={() => void refresh()}>Ver recientes</Button></div>}
          {inbox.isSuccess && online && !count.isError && items.length === 0 && <p className="notification-empty">Todavía no tienes notificaciones.</p>}
          {items.length > 0 && <ul className="notification-list" aria-label="Bandeja de notificaciones">{items.map((item) => <NotificationItem
            key={item.id} item={item} search={search} pending={read.isPending && read.variables === item.id}
            disabled={disabled} onRead={(id) => read.mutate(id)} onNavigate={() => setOpen(false)} />)}</ul>}
          {inbox.hasNextPage && <div className="notification-pagination"><Button type="button" variant="outline" size="sm" disabled={disabled || inbox.isFetching}
            onClick={() => void inbox.fetchNextPage()}>{inbox.isFetchingNextPage ? 'Cargando…' : 'Cargar más'}</Button></div>}
        </>}
      </div>
      <div className="notification-panel-footer">{lastUpdate > 0 ? <>Última consulta: {new Date(lastUpdate).toLocaleTimeString('es-PE', { timeZone: 'America/Lima' })} PET</> : 'Actualización automática'}
        <span>Leer un aviso no reconoce ni cierra el incidente.</span></div>
    </PopoverContent>
  </Popover>;
}
