import { PermissionCode } from '@/modules/auth/enums/permission-code.enum';
import type { EmployeePrincipal } from '@/modules/auth/types/auth.types';
import { isOwnAccessQuestion } from '@/modules/assistant/services/local-assistant-reply';

interface ProtectedTopic {
  permission: PermissionCode;
  label: string;
  pattern: RegExp;
}

const PROTECTED_TOPICS: ProtectedTopic[] = [
  {
    permission: PermissionCode.ACCESS_CONTROL_READ,
    label: 'roles y permisos de administración',
    pattern: /\b(?:administrador(?:es)?|administracion|control de acceso|roles?|permisos?|privilegios?)\b/,
  },
  {
    permission: PermissionCode.EMPLOYEES_READ,
    label: 'empleados',
    pattern: /\b(?:empleados?|personal|usuarios? internos?)\b/,
  },
  {
    permission: PermissionCode.AUDIT_READ,
    label: 'auditoría',
    pattern: /\b(?:auditoria|audit(?:oria)?|trazabilidad)\b/,
  },
  {
    permission: PermissionCode.LOGS_READ,
    label: 'registros técnicos',
    pattern: /\b(?:logs?|bitacora|registros? tecnicos?)\b/,
  },
  {
    permission: PermissionCode.SECURITY_READ,
    label: 'eventos de seguridad',
    pattern: /\b(?:eventos? de seguridad|analisis de seguridad|amenazas?|vulnerabilidades?)\b/,
  },
  {
    permission: PermissionCode.TRANSACTIONS_READ,
    label: 'transacciones',
    pattern: /\b(?:transacciones?|transferencias?)\b/,
  },
];

function normalize(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

export function deniedAssistantTopic(question: string, employee: EmployeePrincipal): string | null {
  const normalized = normalize(question).replace(/[¿?¡!.,]/g, '').trim();
  if (/\b(?:dame|muestra|revela|cual es|lista|ver)\b.{0,50}\b(?:contrasenas?|passwords?|claves? secretas?|tokens?|api keys?|credenciales?)\b/.test(normalized)) {
    return 'credenciales o secretos';
  }
  // An employee may ask about their own available capabilities without access-control.read.
  if (isOwnAccessQuestion(question) ||
      /^(?:que puedo consultar|que puedo hacer)$/.test(normalized) ||
      /^(?:que permisos tengo|que roles tengo)$/.test(normalized)) {
    return null;
  }
  const granted = new Set(employee.permissions);
  return PROTECTED_TOPICS.find((topic) =>
    topic.pattern.test(normalized) && !granted.has(topic.permission),
  )?.label ?? null;
}
