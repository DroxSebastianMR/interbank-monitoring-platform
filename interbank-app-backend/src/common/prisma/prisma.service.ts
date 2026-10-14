import { Injectable, type OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  // Prisma connects on the first database query. Keep Redis-backed device login
  // available when PostgreSQL is temporarily unreachable during startup.
  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
