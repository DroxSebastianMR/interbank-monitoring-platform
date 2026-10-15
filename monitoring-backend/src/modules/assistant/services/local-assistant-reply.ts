import type {
  AssistantAnswer,
  AssistantEvidence,
} from '@/modules/ai-integration/types/ai-integration.types';

const GREETINGS = new Set([
  'hola',
  'hola buenas',
  'buenas',
  'buen dia',
  'buenos dias',
  'buenas tardes',
  'buenas noches',
  'que tal',
  'hola que tal',
]);
const CAPABILITY_QUESTIONS = new Set([
  'podemos hablar',
  'podemos hablar normal',
  'pero podemos hablar normal',
  'que puedes hacer',
  'en que me puedes ayudar',
  'como me puedes ayudar',
  'no me puedes hablar de otro tema',
  'me puedes hablar de otro tema',
  'puedes hablarme de otro tema',
  'podemos hablar de otro tema',
  'podemos hablar de otra cosa',
  'solo hablas de monitoreo',
  'solo puedes hablar del monitor',
  'de que podemos hablar',
  'mis permisos',
  'mis roles',
  'que permisos tengo',
  'que roles tengo',
  'que puedo consultar',
  'que puedo hacer',
  'cuales son mis permisos',
  'cuales son mis roles',
]);
const SOCIAL_QUESTIONS = new Set(['como estas', 'como te va', 'todo bien', 'estas bien', 'como va tu dia']);

function normalize(question: string): string {
  return question
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[¿?¡!.,]/g, '')
    .trim();
}

export function isOwnAccessQuestion(question: string): boolean {
  const normalized = normalize(question);
  if (/\b(?:otros?|todos|administradores?|empleados?|asigna|cambia|modifica)\b/.test(normalized)) {
    return false;
  }
  return /\b(?:mi|mis)\s+(?:rol(?:es)?|perfil|permisos?)\b/.test(normalized) ||
    /\b(?:rol(?:es)?|perfil|permisos?)\s+(?:tengo|tiene mi (?:usuario|cuenta)|me corresponden?)\b/.test(normalized) ||
    /\bmi (?:usuario|cuenta)\b.{0,30}\b(?:rol(?:es)?|perfil|permisos?)\b/.test(normalized);
}

export function isInstanceOutageQuestion(question: string): boolean {
  const normalized = normalize(question);
  return /\b(?:instancias?|app-backend-\d+|backends?)\b/.test(normalized) &&
    /\b(?:caida|cayo|cayeron|fallo|indisponibilidad|incidente)\b/.test(normalized);
}

export function isConversationalIntent(question: string): boolean {
  const normalized = normalize(question);
  return GREETINGS.has(normalized) ||
    /^hola+(?:\s+buenas*(?:\s+(?:noches|tardes))?)?$/.test(normalized) ||
    CAPABILITY_QUESTIONS.has(normalized) || SOCIAL_QUESTIONS.has(normalized) ||
    isOwnAccessQuestion(question);
}

export function isClearlyUnrelatedQuestion(question: string): boolean {
  const normalized = normalize(question);
  return /\b(?:independencia|historia|capital de|futbol|pelicula|receta|horoscopo)\b/.test(normalized) &&
    !isMonitoringQuestion(normalized);
}

function isMonitoringQuestion(question: string): boolean {
  return (
    /monitor|servicio|servidor|backend|nginx|redis|prometheus|latencia|incidente|alerta|caida|disponibilidad|transferencia|login|balance|cpu|memoria|base de datos|transaccion|salud|metrica|riesgo|anomalia/.test(
      question,
    ) ||
    /\b(?:como va|estado|resumen|salud|rendimiento)\b.{0,50}\bsistema\b/.test(question) ||
    /\bsistema\b.{0,30}\b(?:actualmente|ahora|hoy|monitor|interbank)\b/.test(question) ||
    (/\b(?:el|este|nuestro|tu)\s+sistema\b/.test(question) &&
      !/\bsistema\s+(?:solar|digestivo|nervioso|operativo\s+(?:windows|linux|macos))\b/.test(question))
  );
}

export function buildLocalAssistantAnswer(evidence: AssistantEvidence): AssistantAnswer {
  const { asOf, services } = evidence;
  const question = normalize(evidence.question);
  const greeting = GREETINGS.has(question) ||
    /^hola+(?:\s+buenas*(?:\s+(?:noches|tardes))?)?$/.test(question);
  const capabilities = CAPABILITY_QUESTIONS.has(question);
  const social = SOCIAL_QUESTIONS.has(question);
  const ownAccess = isOwnAccessQuestion(evidence.question);
  const inScope = isMonitoringQuestion(question);
  const asksAboutInstanceOutage = isInstanceOutageQuestion(evidence.question);

  let answer: string;
  if (greeting) {
    answer =
      '¡Hola! Me alegra ayudarte. Puedo contarte cómo van los servicios, las alertas o los incidentes del monitor. ¿Qué te gustaría revisar?';
  } else if (capabilities) {
    answer =
      'Claro, podemos conversar con naturalidad. Estoy aquí para ayudarte a entender cómo va el sistema: servicios, métricas, alertas e incidentes. Por ejemplo, pregúntame «¿cómo va el sistema ahora?».';
  } else if (social) {
    answer = 'Estoy listo para ayudarte 😊. ¿Qué te gustaría revisar del monitor?';
  } else if (ownAccess) {
    const roles = evidence.access.roles.length ? evidence.access.roles.join(', ') : 'ningún rol asignado';
    const asksPermissions = /\bpermisos?\b/.test(question);
    const asksRole = /\b(?:rol(?:es)?|perfil)\b/.test(question);
    answer = asksRole || !asksPermissions ? `Según tu sesión actual, tu rol es ${roles}.` : '';
    if (asksPermissions) {
      answer += `${answer ? ' ' : ''}Tus permisos actuales son: ${evidence.access.permissions.length
        ? evidence.access.permissions.join(', ') : 'ninguno asignado'}.`;
    }
  } else if (asksAboutInstanceOutage && !evidence.coverage.instanceLevel) {
    const latest = [...evidence.incidents].sort((a, b) => b.openedAt.localeCompare(a.openedAt))[0];
    const format = (value: string) => `${new Intl.DateTimeFormat('es-PE', {
      timeZone: 'America/Lima', day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }).format(new Date(value))} (hora de Lima)`;
    answer = 'No puedo confirmar la última caída de una instancia concreta: el monitor todavía no mide app-backend-1 y app-backend-2 por separado.';
    if (latest) {
      answer += ` El último incidente de servicio registrado fue ${latest.serviceId}, de severidad ${latest.severity}, abierto el ${format(latest.openedAt)}` +
        (latest.resolvedAt ? ` y resuelto el ${format(latest.resolvedAt)}.` : `; su estado actual es ${latest.status}.`) +
        ` La última observación fue el ${format(latest.lastObservedAt)}.` +
        ' Es una observación del servicio a través de NGINX; no prueba qué instancia falló ni establece la causa raíz.';
    } else {
      answer += ' Tampoco hay un incidente de servicio en la evidencia disponible al que pueda atribuirle fechas o impacto.';
    }
  } else if (!inScope) {
    answer = /\b(?:independencia|historia|batalla|virreinato)\b/.test(question)
      ? 'Lo siento, la historia general queda fuera de mi función aquí. Puedo ayudarte con el estado y los incidentes del monitor de Interbank.'
      : /\b(?:santa rosa|cumpleanos|nacimiento|nacio|santo|santa)\b/.test(question)
        ? 'Esa fecha biográfica no forma parte de los datos del monitor. Si quieres, puedo revisar contigo un servicio o incidente del sistema.'
      : 'Ese tema queda fuera de mi función aquí. Puedo ayudarte con el estado y los incidentes del monitor de Interbank.';
  } else if (!services.length) {
    answer =
      'Quiero ayudarte con ese resumen, pero ahora no tengo datos de servicios para hacerlo con certeza. Prueba de nuevo en un momento.';
  } else {
    answer = `Con los datos disponibles, esto es lo que veo: ${services.map((service) => `${service.name}: ${service.status}`).join(', ')}. Observado al ${asOf}.`;
  }

  return {
    answer,
    provider: 'deterministic',
    asOf,
    evidenceServiceIds:
      asksAboutInstanceOutage && evidence.incidents.length
        ? [[...evidence.incidents].sort((a, b) => b.openedAt.localeCompare(a.openedAt))[0].serviceId]
        : inScope && !greeting && !capabilities && !social && !ownAccess
          ? services.map((service) => service.id) : [],
  };
}
