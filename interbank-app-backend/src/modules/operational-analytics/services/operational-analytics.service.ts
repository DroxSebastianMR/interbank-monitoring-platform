import { Injectable } from '@nestjs/common';
import { OperationalAnalyticsRepository, type BankingBucket } from '@/modules/operational-analytics/repositories/operational-analytics.repository';

export function limaWindow(now: Date): { start: Date; end: Date; today: string; yesterday: string } {
  const date = new Date(now.getTime() - 5 * 3600000).toISOString().slice(0, 10);
  const midnight = new Date(`${date}T00:00:00-05:00`);
  return { today: date, yesterday: new Date(midnight.getTime() - 86400000 - 5 * 3600000).toISOString().slice(0, 10), start: new Date(midnight.getTime() - 29 * 86400000), end: now };
}
export function summarizeBuckets(rows: BankingBucket[], today: string, yesterday: string) {
  const current = rows.filter((row) => row.date === today);
  const total = current.reduce((sum, row) => sum + row.count, 0);
  const completed = current.filter((row) => row.status === 'COMPLETED').reduce((sum, row) => sum + row.count, 0);
  const previousTotal = rows.filter((row) => row.date === yesterday).reduce((sum, row) => sum + row.count, 0);
  return { total, completed, previousTotal, successRate: total ? completed / total : null };
}
@Injectable()
export class OperationalAnalyticsService {
  private cached?: { at: number; value: Awaited<ReturnType<OperationalAnalyticsService['collect']>> };
  private pending?: Promise<Awaited<ReturnType<OperationalAnalyticsService['collect']>>>;
  constructor(private readonly repository: OperationalAnalyticsRepository) {}
  snapshot() {
    if (this.cached && Date.now() - this.cached.at < 30000) return Promise.resolve(this.cached.value);
    if (this.pending) return this.pending;
    this.pending = this.collect().then((value) => { this.cached = { at: Date.now(), value }; return value; }).finally(() => { this.pending = undefined; });
    return this.pending;
  }
  private async collect() {
    const window = limaWindow(new Date());
    const buckets = await this.repository.aggregate(window.start, window.end);
    return { source: 'POSTGRESQL_BUSINESS_OPERATIONS', generatedAt: new Date().toISOString(), timezone: 'America/Lima', windowStart: window.start.toISOString(), windowEnd: window.end.toISOString(), today: window.today, summary: summarizeBuckets(buckets, window.today, window.yesterday), buckets, limitations: ['Counts only persisted transfers, Plin and service payments; not HTTP requests or ledger entries.', 'Rejected requests rolled back before persistence are not counted.', 'No per-instance attribution is stored. Previous day is a full day; today is partial.'] };
  }
}
