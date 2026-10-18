import { PlinPolicy } from '@/modules/plin/policies/plin.policy';

describe('PlinPolicy', () => {
  it('uses the Peru calendar day instead of UTC midnight', () => {
    expect(PlinPolicy.peruDayStart(new Date('2026-10-15T04:30:00Z')).toISOString()).toBe(
      '2026-10-14T05:00:00.000Z',
    );
    expect(PlinPolicy.peruDayStart(new Date('2026-10-15T05:30:00Z')).toISOString()).toBe(
      '2026-10-15T05:00:00.000Z',
    );
  });

  it('enforces transaction limits and stable fingerprints', () => {
    expect(PlinPolicy.amount(1).toFixed(2)).toBe('1.00');
    expect(PlinPolicy.amount(500).toFixed(2)).toBe('500.00');
    expect(() => PlinPolicy.amount(500.01)).toThrow();
    expect(() => PlinPolicy.amount(0.99)).toThrow();
    expect(
      PlinPolicy.fingerprint(
        { fromAccountId: 'ABC', phoneNumber: '987654321', amount: 20 },
        PlinPolicy.amount(20),
      ),
    ).toBe(
      PlinPolicy.fingerprint(
        { fromAccountId: 'abc', phoneNumber: '987654321', amount: 20 },
        PlinPolicy.amount(20),
      ),
    );
  });
});
