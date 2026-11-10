import { PublicNoticeKind as Kind } from '@/modules/public-status/enums/public-notice.enum';
import { publicNoticeText, publicState } from '@/modules/public-status/policies/public-notice.policy';

describe('Public communication policy', () => {
  it('does not turn missing information or recovery verification into healthy status', () => {
    expect(publicState('NO_DATA')).toBe('NO_DATA');
    expect(publicState('RECOVERING')).toBe('DEGRADED');
    expect(publicState('unexpected')).toBe('NO_DATA');
  });
  it('rejects non-catalog services, including prototype property names', () => {
    expect(() => publicNoticeText('constructor', Kind.INITIAL, 'UNAVAILABLE')).toThrow();
    expect(() => publicNoticeText('private-database', Kind.INITIAL, 'UNAVAILABLE')).toThrow();
  });
  it('keeps preventive messages as possibility and recovery separate from transaction outcome', () => {
    expect(publicNoticeText('login', Kind.PREVENTIVE, 'OPERATIONAL').body).toContain('no confirma una interrupción');
    expect(publicNoticeText('transfers', Kind.RECOVERY, 'OPERATIONAL').body).toContain('no confirma el resultado');
    const publicText = publicNoticeText('balance', Kind.INITIAL, 'internal-node:5000');
    expect(JSON.stringify(publicText)).not.toContain('internal-node');
  });
});
