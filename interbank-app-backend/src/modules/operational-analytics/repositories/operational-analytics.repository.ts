import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';

export interface BankingBucket { date: string; hour: number; category: 'TRANSFER' | 'PLIN' | 'SERVICE_PAYMENT'; status: string; count: number }

@Injectable()
export class OperationalAnalyticsRepository {
  constructor(private readonly prisma: PrismaService) {}
  async aggregate(start: Date, end: Date): Promise<BankingBucket[]> {
    // Count the business operation ONCE, not its debit+credit ledger entries.
    // PLIN is a transfer with a unique related plin_payment; never counted twice.
    return this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SET LOCAL statement_timeout = '2500ms'`;
      return tx.$queryRaw<BankingBucket[]>`
        WITH operations AS (
          SELECT t."createdAt" AS at, t.status::text AS status,
            CASE WHEN p.id IS NULL THEN 'TRANSFER' ELSE 'PLIN' END AS category
          FROM app.transfers t LEFT JOIN app.plin_payments p ON p."transferId" = t.id
          WHERE t."createdAt" >= ${start} AND t."createdAt" < ${end}
          UNION ALL
          SELECT s."createdAt", s.status::text, 'SERVICE_PAYMENT'
          FROM app.service_payments s
          WHERE s."createdAt" >= ${start} AND s."createdAt" < ${end}
        )
        SELECT to_char((at AT TIME ZONE 'UTC') AT TIME ZONE 'America/Lima', 'YYYY-MM-DD') AS date,
          extract(hour FROM (at AT TIME ZONE 'UTC') AT TIME ZONE 'America/Lima')::int AS hour,
          category, status, count(*)::int AS count
        FROM operations GROUP BY 1, 2, 3, 4 ORDER BY 1, 2, 3, 4
      `;
    }, { maxWait: 1000, timeout: 3500 });
  }
}
