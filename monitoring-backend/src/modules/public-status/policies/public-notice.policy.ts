import { PublicNoticeKind as Kind } from '@/modules/public-status/enums/public-notice.enum';

/** Explicit public catalog: never expose arbitrary internal service names or routes. */
export const PUBLIC_SERVICES: Readonly<Record<string, string>> = {
  login: 'Inicio de sesión', balance: 'Consulta de saldo', transfers: 'Transferencias ficticias',
};
export const PUBLIC_TEMPLATE_VERSION = 'laboratory-status-v1';
export const FOLLOW_UP_INTERVAL_MS = 300_000;

export function publicState(technicalStatus: string): 'OPERATIONAL' | 'DEGRADED' | 'UNAVAILABLE' | 'NO_DATA' {
  if (technicalStatus === 'OPERATIONAL' || technicalStatus === 'UNAVAILABLE') return technicalStatus;
  return ['DEGRADED', 'RECOVERING'].includes(technicalStatus) ? 'DEGRADED' : 'NO_DATA';
}

/** Versioned templates have only catalog-approved variables; never use incident notes. */
export function publicNoticeText(serviceKey: string, kind: Kind, technicalStatus: string) {
  const name = PUBLIC_SERVICES[serviceKey];
  if (!Object.hasOwn(PUBLIC_SERVICES, serviceKey)) throw new Error('Service is not in the public catalog');
  if (kind === Kind.PREVENTIVE) return { title: `Aviso preventivo: ${name}`,
    body: `${name} podría presentar intermitencias. Este aviso indica una posibilidad; no confirma una interrupción.` };
  if (kind === Kind.RECOVERY) return { title: `${name}: restablecimiento confirmado`,
    body: 'Se confirmó el restablecimiento del servicio. Este aviso no confirma el resultado de operaciones anteriores.' };
  if (kind === Kind.SNAPSHOT) return { title: `${name}: disponible`, body: 'No hay afectaciones confirmadas según las observaciones recientes.' };
  if (technicalStatus === 'RECOVERING') return { title: `${name}: restablecimiento en verificación`,
    body: 'Se está verificando el restablecimiento. Todavía pueden presentarse dificultades al utilizar el servicio.' };
  if (kind === Kind.FOLLOW_UP) return { title: `${name}: actualización de la afectación`,
    body: 'La afectación continúa. Consulta esta página para conocer las próximas actualizaciones.' };
  return { title: `${name}: ${technicalStatus === 'UNAVAILABLE' ? 'temporalmente no disponible' : 'funcionamiento degradado'}`,
    body: 'Se confirmó una afectación del servicio. Si una operación quedó pendiente, revisa su resultado antes de repetirla.' };
}
