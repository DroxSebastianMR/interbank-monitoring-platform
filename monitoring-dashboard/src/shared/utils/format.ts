type DateInput = string | number | Date;

export function formatDateTime(value: DateInput): string {
  return new Date(value).toLocaleString('es-PE');
}

export function formatTime(value: DateInput): string {
  return new Date(value).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
}

export function formatClockTime(value: DateInput): string {
  return new Date(value).toLocaleTimeString('es-PE', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function formatShortDate(value: DateInput): string {
  return new Date(value).toLocaleDateString('es-PE', {
    weekday: 'long',
    day: '2-digit',
    month: 'short',
  });
}
