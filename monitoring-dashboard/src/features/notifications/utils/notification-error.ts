import { isAxiosError } from 'axios';
import { ApiError } from '@/infrastructure/api/client/axios.interceptors';

export function notificationError(error: unknown): keyof typeof notificationErrorMessages | null {
  if (!error) return null;
  const status = error instanceof ApiError ? error.status : isAxiosError(error) ? error.response?.status : undefined;
  const message = error instanceof ApiError ? error.message : isAxiosError(error) ? error.response?.data?.message : undefined;
  if (status === 401) return 'unauthorized';
  if (status === 403) return 'forbidden';
  if (status === 404) return 'not-available';
  if (status === 400) return 'invalid-cursor';
  if (status === 503 && message === 'Operational inbox is not enabled') return 'disabled';
  return 'unavailable';
}

export function notificationAccessBlocked(error: unknown) {
  const kind = notificationError(error);
  return kind !== null && kind !== 'unavailable' && kind !== 'invalid-cursor';
}

export const notificationErrorMessages = {
  unauthorized: 'Tu sesión no permite consultar las notificaciones. Vuelve a iniciar sesión.',
  forbidden: 'Ya no tienes permiso para consultar esta bandeja.',
  'not-available': 'La API de notificaciones no está disponible en esta versión del servidor.',
  'invalid-cursor': 'La referencia de esta página dejó de estar disponible. Vuelve a las más recientes.',
  disabled: 'Las notificaciones están deshabilitadas en este entorno.',
  unavailable: 'No se pudo actualizar la bandeja. La última información recibida puede estar desactualizada.',
} as const;
