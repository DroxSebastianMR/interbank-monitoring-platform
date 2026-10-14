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
  if (outOfScope.status !== 201 || !outOfScope.data?.assistantMessage?.content.includes('Solo puedo ayudarte')) {
    throw new Error('La pregunta fuera de alcance no fue rechazada');
  }
  process.stdout.write(JSON.stringify({
    result: 'ok',
    provider: sent.data.answer.provider,
    evidenceAndAiMs: sent.data.run?.latencyMs,
    ownershipDenied: forbidden.status === 404,
    scopeRejected: true,
    timingsMs: timings,
  }) + '\n');
} finally {
  for (const id of createdEmployeeIds) await prisma.employee.delete({ where: { id } });
  await prisma.$disconnect();
}
