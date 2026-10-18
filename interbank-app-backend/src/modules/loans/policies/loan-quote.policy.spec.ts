import { LoanQuotePolicy } from '@/modules/loans/policies/loan-quote.policy';

describe('LoanQuotePolicy', () => {
  it('creates a positive amortizing quote with a zero final balance', () => {
    const quote = LoanQuotePolicy.quote(10_000, 12);
    const schedule = LoanQuotePolicy.schedule(quote);
    expect(schedule).toHaveLength(12);
    expect(schedule[0].interest).not.toBe('0.00');
    expect(schedule.at(-1)?.remainingBalance).toBe('0.00');
    expect(quote.totalRepayment.gt(quote.principal)).toBe(true);
    expect(quote.totalRepayment.toFixed(2)).toBe(
      schedule.reduce((sum, item) => sum.plus(item.payment), quote.principal.mul(0)).toFixed(2),
    );
  });

  it('rejects unsupported terms and amounts', () => {
    expect(() => LoanQuotePolicy.quote(999, 12)).toThrow();
    expect(() => LoanQuotePolicy.quote(10_000, 13)).toThrow();
    expect(() => LoanQuotePolicy.quote(10_000.123, 12)).toThrow();
  });
});
