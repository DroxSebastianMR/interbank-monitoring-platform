import { performance } from 'node:perf_hooks';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const samples = [];
let conversationId;

try {
  const employee = await prisma.employee.findFirst({ select: { id: true } });
  if (!employee) throw new Error('No hay empleados para verificar la relación del asistente');
  const start = performance.now();
  const conversation = await prisma.assistantConversation.create({
    data: { employeeId: employee.id, title: 'Verificación temporal del asistente' },
  });
  conversationId = conversation.id;
  const user = await prisma.assistantMessage.create({
    data: { conversationId, role: 'user', content: '¿Cómo está el servicio login?' },
  });
  const answer = await prisma.assistantMessage.create({
    data: { conversationId, role: 'assistant', content: 'Verificación de persistencia', provider: 'deterministic' },
  });
  await prisma.assistantRun.create({
    data: { messageId: answer.id, provider: 'deterministic', status: 'COMPLETED', latencyMs: 1, promptVersion: 'monitor-v1' },
  });
  const stored = await prisma.assistantConversation.findUnique({
    where: { id: conversationId }, include: { messages: { include: { run: true } } },
  });
  if (stored?.messages.length !== 2 || stored.messages.find((item) => item.id === answer.id)?.run?.provider !== 'deterministic' || !user.id) {
    throw new Error('La relación conversación/mensajes/ejecución no quedó almacenada');
  }
  const writeMs = performance.now() - start;
  for (let index = 0; index < 10; index += 1) {
    const readStart = performance.now();
    await prisma.assistantConversation.findMany({
      where: { employeeId: employee.id, deletedAt: null },
      take: 20,
      orderBy: { updatedAt: 'desc' },
      select: { id: true, title: true },
    });
    samples.push(performance.now() - readStart);
  }
  samples.sort((a, b) => a - b);
  process.stdout.write(JSON.stringify({
    persisted: true,
    writeAndReadMs: Math.round(writeMs),
    listP50Ms: Math.round(samples[4]),
    listP95Ms: Math.round(samples[9]),
    reads: samples.length,
  }) + '\n');
} finally {
  if (conversationId) await prisma.assistantConversation.delete({ where: { id: conversationId } });
  await prisma.$disconnect();
}
