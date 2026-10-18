export interface BankingAnalytics {
  source: 'POSTGRESQL_BUSINESS_OPERATIONS'; generatedAt: string; timezone: 'America/Lima'; windowStart: string; windowEnd: string; today: string;
  summary: { total: number; completed: number; previousTotal: number; successRate: number | null };
  buckets: Array<{ date: string; hour: number; category: string; status: string; count: number }>;
  limitations: string[];
}
const record = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === 'object';
const count = (value: unknown): value is number => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
export function isBankingAnalytics(value: unknown): value is BankingAnalytics {
  if (!record(value) || value.source !== 'POSTGRESQL_BUSINESS_OPERATIONS' || value.timezone !== 'America/Lima') return false;
  if (!['generatedAt', 'windowStart', 'windowEnd', 'today'].every((key) => typeof value[key] === 'string' && Number.isFinite(Date.parse(value[key])))) return false;
  const summary = value.summary;
  if (!record(summary) || ![summary.total, summary.completed, summary.previousTotal].every(count)) return false;
  if (summary.successRate !== null && (typeof summary.successRate !== 'number' || !Number.isFinite(summary.successRate) || summary.successRate < 0 || summary.successRate > 1)) return false;
  return Array.isArray(value.buckets) && value.buckets.length <= 10000 && value.buckets.every((row: unknown) => record(row) && typeof row.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(row.date) && count(row.hour) && row.hour < 24 && typeof row.category === 'string' && ['TRANSFER', 'PLIN', 'SERVICE_PAYMENT'].includes(row.category) && typeof row.status === 'string' && ['COMPLETED', 'PENDING', 'FAILED', 'REVERSED'].includes(row.status) && count(row.count)) && Array.isArray(value.limitations) && value.limitations.length <= 10 && value.limitations.every((item: unknown) => typeof item === 'string' && item.length < 500);
}
