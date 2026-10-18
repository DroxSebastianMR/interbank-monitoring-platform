const SERVICE_NAMES: Record<string, string> = {
  transfers: 'Transferencias',
  balance: 'Saldos',
  login: 'Inicio de sesión',
};

const SERVICE_SUBJECTS: Record<string, string> = {
  transfers: 'Servicio de transferencias',
  balance: 'Servicio de saldos',
  login: 'Servicio de inicio de sesión',
};

export function getServiceDisplayName(serviceKey: string): string {
  return SERVICE_NAMES[serviceKey.toLowerCase()] ?? serviceKey;
}

export function translateOperationalMessage(message: string, serviceKey: string): string {
  const normalized = message.trim().toLowerCase();
  const service = SERVICE_SUBJECTS[serviceKey.toLowerCase()] ?? serviceKey;
  if (normalized.includes('unavailable')) return `${service} no disponible`;
  if (normalized.includes('degraded')) return `${service} degradado`;
  if (normalized.includes('recovering')) return `${service} recuperándose`;
  if (normalized.includes('timeout')) return `${service}: tiempo de espera agotado`;

  const translated = message
    .replace(/\btransfers?\b/gi, 'Transferencias')
    .replace(/\bbalance\b/gi, 'Saldos')
    .replace(/\blogin\b/gi, 'Inicio de sesión')
    .replace(/\bfailed\b/gi, 'falló')
    .replace(/\bdown\b/gi, 'fuera de servicio');
  return translated.charAt(0).toUpperCase() + translated.slice(1);
}
