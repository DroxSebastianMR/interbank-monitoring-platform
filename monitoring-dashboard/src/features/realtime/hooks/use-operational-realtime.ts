import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { io } from 'socket.io-client';
import { env } from '@/app/config/env';
import { authStorage } from '@/features/auth/utils/auth.storage';
import type { EndpointSnapshot } from '@/features/endpoints/types/endpoint.types';
import { operationalEventSchema } from '@/features/realtime/types/operational-event.schema';
import { applyEndpointEvent } from '@/features/realtime/utils/apply-endpoint-event';

/** One connection per authenticated layout; never one connection per card. */
export function useOperationalRealtime(employeeId: string | undefined, permissions: string) {
  const client = useQueryClient();
  const [status, setStatus] = useState('Conectando');
  useEffect(() => {
    const allowed = permissions.split(',');
    if (!employeeId || !allowed.some((item) => ['analytics.read', 'incidents.read'].includes(item))) return;
    const key = ['endpoint-observability', employeeId];
    const resync = () => {
      if (allowed.includes('analytics.read')) void client.invalidateQueries({ queryKey: key });
      if (allowed.includes('incidents.read')) void client.invalidateQueries({ queryKey: ['incidents', employeeId] });
      if (allowed.includes('alerts.read')) void client.invalidateQueries({ queryKey: ['alerts', employeeId] });
    };
    const socket = io(`${env.apiUrl.replace(/\/$/, '')}/operations`, {
      transports: ['websocket'], autoConnect: false, reconnectionDelay: 1000, reconnectionDelayMax: 10000,
      auth: (callback) => callback({ token: authStorage.getSession()?.tokens.accessToken }),
    });
    socket.on('ready', () => { setStatus('Eventos conectados'); resync(); });
    socket.on('disconnect', () => setStatus('Sin conexión · respaldo HTTP'));
    socket.on('connect_error', () => setStatus('Respaldo HTTP'));
    socket.on('operational.event', (raw: unknown) => {
      const parsed = operationalEventSchema.safeParse(raw);
      if (!parsed.success) { resync(); return; }
      const event = parsed.data;
      if (event.channel === 'incidents') {
        resync();
        const scope = `${employeeId}:${permissions}`;
        for (const queryKey of [
          ['dashboard-overview', scope], ['dashboard-attention-incidents', scope],
          ['dashboard-historical-alerts', scope], ['dashboard-service-observations', scope],
          ['dashboard-state-history', scope],
        ]) void client.invalidateQueries({ queryKey }, { cancelRefetch: false });
        return;
      }
      const current = client.getQueryData<EndpointSnapshot>(key);
      const next = current ? applyEndpointEvent(current, event) : null;
      if (next) client.setQueryData(key, next);
      else void client.invalidateQueries({ queryKey: key });
    });
    socket.connect();
    // Also detects a lost LAST event, for which no subsequent sequence gap exists.
    const timer = setInterval(() => { if (!socket.connected) socket.connect(); resync(); }, 30000);
    return () => { clearInterval(timer); socket.removeAllListeners(); socket.disconnect(); };
  }, [client, employeeId, permissions]);
  return permissions.split(',').some((item) => ['analytics.read', 'incidents.read'].includes(item)) ? status : 'Consulta HTTP';
}
