import { limaWindow, summarizeBuckets } from '@/modules/operational-analytics/services/operational-analytics.service';
describe('Persisted banking analytics', () => {
  it('uses Peru calendar boundaries, not the UTC day', () => {
    const window = limaWindow(new Date('2026-10-19T03:00:00Z'));
    expect(window.today).toBe('2026-10-18');
    expect(window.yesterday).toBe('2026-10-17');
    expect(window.start.toISOString()).toBe('2026-09-19T05:00:00.000Z');
  });
  it('counts business categories once and preserves noncompleted outcomes', () => {
    expect(summarizeBuckets([
      { date: '2026-10-18', hour: 10, category: 'PLIN', status: 'COMPLETED', count: 1 },
      { date: '2026-10-18', hour: 10, category: 'TRANSFER', status: 'PENDING', count: 1 },
      { date: '2026-10-17', hour: 10, category: 'SERVICE_PAYMENT', status: 'FAILED', count: 3 },
    ], '2026-10-18', '2026-10-17')).toEqual({ total: 2, completed: 1, previousTotal: 3, successRate: 0.5 });
    expect(summarizeBuckets([], '2026-10-18', '2026-10-17').successRate).toBeNull();
  });
});
