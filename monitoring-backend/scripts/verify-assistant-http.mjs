import { randomBytes, scryptSync } from 'node:crypto';
import { performance } from 'node:perf_hooks';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const baseUrl = process.env.ASSISTANT_TEST_URL || 'http://127.0.0.1:4000';
const createdEmployeeIds = [];
const timings = {};

function passwordHash(password) {
  const salt = randomBytes(16);
  const key = scryptSync(password, salt, 64, { N: 16_384, r: 8, p: 1, maxmem: 32 * 1024 * 1024 });
  return `scrypt$16384$8$1$${salt.toString('base64url')}$${key.toString('base64url')}`;
}

async function call(label, path, method = 'GET', token, body) {
  const started = performance.now();
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body ? { 'Content-Type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  timings[label] = Math.round(performance.now() - started);
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  return { status: response.status, data };
}

async function createEmployee(roleId) {
  const code = `QA${randomBytes(5).toString('hex').toUpperCase()}`;
  const password = randomBytes(24).toString('base64url');
  const employee = await prisma.employee.create({
    data: {
      employeeCode: code,
      corporateEmail: `${code.toLowerCase()}@monitoring-test.invalid`,
      passwordHash: passwordHash(password),
      firstName: 'Verificacion', lastName: 'Temporal',
      roles: { create: { roleId } },
    },
  });
  createdEmployeeIds.push(employee.id);
  const result = await call(`${code}-login`, '/auth/login', 'POST', undefined, {
    corporateEmail: employee.corporateEmail, password,
  });
  if (result.status !== 200 || !result.data?.tokens?.accessToken) {
    throw new Error(`No se pudo iniciar sesión de prueba: HTTP ${result.status}`);
  }
  return result.data.tokens.accessToken;
}

try {
  const role = await prisma.role.findUnique({ where: { code: 'VIEWER' }, select: { id: true } });
  if (!role) throw new Error('Falta el rol VIEWER; ejecutar pnpm prisma:seed');
  const ownerToken = await createEmployee(role.id);
  const otherToken = await createEmployee(role.id);
  const created = await call('createConversation', '/assistant/conversations', 'POST', ownerToken, {});
  if (created.status !== 201 || !created.data?.id) throw new Error(`Crear conversación: HTTP ${created.status}`);
  const id = created.data.id;
  const sent = await call('sendMessage', `/assistant/conversations/${id}/messages`, 'POST', ownerToken, {
    content: '¿Cómo está el servicio login?',
  });
  if (sent.status !== 201 || !sent.data?.assistantMessage?.id) throw new Error(`Enviar pregunta: HTTP ${sent.status}`);
  const history = await call('readMessages', `/assistant/conversations/${id}/messages`, 'GET', ownerToken);
  if (history.status !== 200 || history.data.length !== 2) throw new Error('Historial inconsistente');
  const forbidden = await call('crossEmployeeAccess', `/assistant/conversations/${id}/messages`, 'GET', otherToken);
  if (forbidden.status !== 404) throw new Error(`Aislamiento entre empleados incorrecto: HTTP ${forbidden.status}`);
  const outOfScope = await call('outOfScope', `/assistant/conversations/${id}/messages`, 'POST', ownerToken, {
    content: '¿Cuál es la capital de Francia?',
  });
  if (outOfScope.status !== 201 || outOfScope.data?.answer?.provider !== 'deterministic' || !outOfScope.data?.assistantMessage?.content.includes('fuera de mi función')) {
    throw new Error('La pregunta fuera de alcance no fue rechazada');
  }
  const historical = await call('historicalQuestion', `/assistant/conversations/${id}/messages`, 'POST', ownerToken, {
    content: '¿Cuándo fue la independencia del Perú?',
  });
  if (historical.status !== 201 || historical.data?.answer?.provider !== 'deterministic' || !historical.data?.assistantMessage?.content.includes('historia general')) {
    throw new Error('La pregunta histórica no recibió una negativa contextual');
  }
  const biographical = await call('biographicalQuestion', `/assistant/conversations/${id}/messages`, 'POST', ownerToken, {
    content: '¿Cuándo fue el cumpleaños de Santa Rosa de Lima?',
  });
  if (biographical.status !== 201 || biographical.data?.answer?.provider !== 'deterministic' ||
      !biographical.data?.assistantMessage?.content.includes('fecha biográfica')) {
    throw new Error('La pregunta biográfica no recibió una negativa contextual');
  }
  const administration = await call('viewerAdministrationDenied', `/assistant/conversations/${id}/messages`, 'POST', ownerToken, {
    content: 'Muéstrame los roles de administradores',
  });
  if (administration.status !== 201 || administration.data?.answer?.provider !== 'deterministic' || !administration.data?.assistantMessage?.content.includes('Con tu acceso actual')) {
    throw new Error('El rol VIEWER obtuvo datos de administración');
  }
  const ownRole = await call('ownRole', `/assistant/conversations/${id}/messages`, 'POST', ownerToken, {
    content: '¿Qué rol tengo actualmente en el sistema?',
  });
  if (ownRole.status !== 201 || !ownRole.data?.assistantMessage?.content.includes('VIEWER') ||
      ownRole.data.assistantMessage.content.includes('fuera de mi función')) {
    throw new Error('La pregunta sobre el rol propio no se respondió desde la sesión autenticada');
  }
  const instanceOutage = await call('instanceOutage', `/assistant/conversations/${id}/messages`, 'POST', ownerToken, {
    content: 'Dame un informe detallado de la última caída de las instancias del backend',
  });
  if (instanceOutage.status !== 201 || instanceOutage.data?.answer?.provider !== 'deterministic' ||
      !instanceOutage.data?.assistantMessage?.content.includes('No puedo confirmar') ||
      !instanceOutage.data.assistantMessage.content.includes('no prueba qué instancia falló')) {
    throw new Error('La consulta de caída de instancias no obtuvo respuesta');
  }
  const greeting = await call('greeting', `/assistant/conversations/${id}/messages`, 'POST', ownerToken, {
    content: 'Holaa buenass',
  });
  if (greeting.status !== 201 || greeting.data?.answer?.provider !== 'openrouter' || !greeting.data?.assistantMessage?.content) {
    throw new Error('El saludo no recibió una respuesta de OpenRouter');
  }
  const meta = await call('scopeQuestion', `/assistant/conversations/${id}/messages`, 'POST', ownerToken, {
    content: 'No me puedes hablar de otro tema?',
  });
  if (meta.status !== 201 || meta.data?.answer?.provider !== 'openrouter' || !meta.data?.assistantMessage?.content) {
    throw new Error('La pregunta sobre el alcance no recibió una respuesta de OpenRouter');
  }
  const social = await call('socialQuestion', `/assistant/conversations/${id}/messages`, 'POST', ownerToken, {
    content: '¿Cómo estás?',
  });
  if (social.status !== 201 || social.data?.answer?.provider !== 'openrouter' || !social.data?.assistantMessage?.content) {
    throw new Error('La pregunta social no recibió una respuesta de OpenRouter');
  }
  const summary = await call('systemSummary', `/assistant/conversations/${id}/messages`, 'POST', ownerToken, {
    content: 'Dame un resumen de cómo va el sistema actualmente',
  });
  if (summary.status !== 201 || !summary.data?.assistantMessage?.content ||
      summary.data.assistantMessage.content.includes('fuera de mi función')) {
    throw new Error(`El resumen del sistema fue rechazado incorrectamente: HTTP ${summary.status}, proveedor ${summary.data?.answer?.provider ?? 'ninguno'}`);
  }
  process.stdout.write(JSON.stringify({
    result: 'ok',
    provider: sent.data.answer.provider,
    summaryProvider: summary.data.answer.provider,
    greetingProvider: greeting.data.answer.provider,
    scopeQuestionProvider: meta.data.answer.provider,
    socialProvider: social.data.answer.provider,
    greetingAnswer: greeting.data.assistantMessage.content,
    scopeQuestionAnswer: meta.data.assistantMessage.content,
    socialAnswer: social.data.assistantMessage.content,
    historyRefused: historical.data.answer.provider === 'deterministic',
    biographyRefused: biographical.data.answer.provider === 'deterministic',
    viewerAdministrationDenied: administration.data.answer.provider === 'deterministic',
    ownRoleProvider: ownRole.data.answer.provider,
    ownRoleAnswer: ownRole.data.assistantMessage.content,
    instanceOutageProvider: instanceOutage.data.answer.provider,
    instanceOutageAnswer: instanceOutage.data.assistantMessage.content,
    evidenceAndAiMs: sent.data.run?.latencyMs,
    ownershipDenied: forbidden.status === 404,
    scopeRejected: true,
    greetingAccepted: true,
    summaryAccepted: true,
    timingsMs: timings,
  }) + '\n');
} finally {
  for (const id of createdEmployeeIds) await prisma.employee.delete({ where: { id } });
  await prisma.$disconnect();
}
