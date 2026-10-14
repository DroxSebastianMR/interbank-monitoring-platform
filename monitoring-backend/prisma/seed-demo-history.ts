import { PrismaClient, type ServiceStatus } from '@prisma/client';

const prisma = new PrismaClient();
const CHECK_COUNT = 720;
const incidentId = (index: number) => `d4000000-0000-4000-8000-${String(index).padStart(12, '0')}`;
const alertId = (index: number) => `d5000000-0000-4000-8000-${String(index).padStart(12, '0')}`;
const checkId = (index: number) => `d6000000-0000-4000-8000-${String(index).padStart(12, '0')}`;

async function main(): Promise<void> {
  const services = await prisma.monitoredService.findMany({
    where: { code: { in: ['login', 'balance', 'transfers'] } },
    orderBy: { code: 'asc' },
    select: { id: true, code: true },
  });
  if (services.length !== 3)
    throw new Error('Monitored services are missing; run the regular seed first');

  const now = Date.now();
  const checks = Array.from({ length: CHECK_COUNT }, (_, offset) => {
    const index = offset + 1;
    const timedOut = index % 97 === 0;
    const status: ServiceStatus = timedOut
      ? 'UNAVAILABLE'
      : index % 29 === 0
        ? 'DEGRADED'
        : 'OPERATIONAL';
    return {
      id: checkId(index),
      serviceId: services[offset % services.length].id,
      status,
      latencyMs: timedOut ? 3000 : 42 + ((index * 53) % 320),
      reachable: !timedOut,
      timedOut,
      origin: 'DEMO',
      message: `Histórico ficticio de prueba ${index}`,
      checkedAt: new Date(now - (CHECK_COUNT - offset) * 4500),
    };
  });
  for (let offset = 0; offset < checks.length; offset += 100) {
    await prisma.healthCheck.createMany({
      data: checks.slice(offset, offset + 100),
      skipDuplicates: true,
    });
  }

  for (let index = 1; index <= 6; index++) {
    const openedAt = new Date(now - index * 2 * 60 * 60_000);
    const resolvedAt = new Date(openedAt.getTime() + 10 * 60_000);
    const service = services[(index - 1) % services.length];
    await prisma.incident.upsert({
      where: { id: incidentId(index) },
      update: {},
      create: {
        id: incidentId(index),
        serviceKey: service.code,
        title: `Demo · Degradación transitoria de ${service.code}`,
        status: 'RESOLVED',
        severity: index % 3 === 0 ? 'HIGH' : 'MEDIUM',
        openedAt,
        lastObservedAt: resolvedAt,
        resolvedAt,
        evidence: { source: 'DEMO', synthetic: true },
      },
    });
    await prisma.alert.createMany({
      data: [
        {
          id: alertId(index),
          incidentId: incidentId(index),
          kind: 'RECOVERY',
          message: `Demo · ${service.code} se recuperó`,
          createdAt: resolvedAt,
        },
      ],
      skipDuplicates: true,
    });
  }

  const [checkCount, incidentCount] = await Promise.all([
    prisma.healthCheck.count({ where: { origin: 'DEMO' } }),
    prisma.incident.count({ where: { evidence: { path: ['source'], equals: 'DEMO' } } }),
  ]);
  process.stdout.write(
    `Demo monitoring ready: ${checkCount} marked checks, ${incidentCount} resolved incidents.\n`,
  );
}

void main()
  .catch((error: unknown) => {
    process.stderr.write(
      `Demo monitoring failed: ${error instanceof Error ? error.message : String(error)}\n`,
    );
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
