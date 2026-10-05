import { SimulatedCciPolicy } from '@/modules/accounts/policies/simulated-cci.policy';

describe('SimulatedCciPolicy', () => {
  const first = '00000000-0000-4000-8000-000000000001';
  it('generates a stable 20-digit identifier unique to each demo account', () => {
    const cci = SimulatedCciPolicy.generate(first);
    expect(cci).toMatch(/^003\d{17}$/);
    expect(SimulatedCciPolicy.generate(first)).toBe(cci);
    expect(SimulatedCciPolicy.generate('00000000-0000-4000-8000-000000000002')).not.toBe(cci);
  });
  it('normalizes UUID case consistently with PostgreSQL', () => {
    const id = 'abcdef01-abcd-4000-8000-abcdefabcdef';
    expect(SimulatedCciPolicy.generate(id.toUpperCase())).toBe(SimulatedCciPolicy.generate(id));
  });
  it('rejects an invalid account identifier', () => {
    expect(() => SimulatedCciPolicy.generate('not-an-account')).toThrow();
  });
});
