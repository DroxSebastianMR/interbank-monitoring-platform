import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  for (const [name, endpoint] of [
    ['Login', '/health'],
    ['Balance', '/health'],
    ['Transfers', '/health'],
  ])
    await prisma.monitoredService.create({ data: { name, endpoint } });
}
void main()
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`Seed failed: ${message}\n`);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
