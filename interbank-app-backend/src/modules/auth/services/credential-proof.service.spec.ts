import { ConfigService } from '@nestjs/config';

import { CredentialProofService } from '@/modules/auth/services/credential-proof.service';

describe('CredentialProofService', () => {
  const service = new CredentialProofService(
    new ConfigService({
      auth: {
        jwtSecret: 'x'.repeat(32),
        sessionPepper: 'a-different-session-pepper-value',
        accessTokenTtlSeconds: 900,
        sessionTtlSeconds: 300,
      },
    }),
  );

  it('verifies only the same user, device and password tuple', () => {
    const proof = service.create('user-id', 'device-id', 'SecurePassword1!');

    expect(service.matches(proof, 'user-id', 'device-id', 'SecurePassword1!')).toBe(true);
    expect(service.matches(proof, 'user-id', 'other-device', 'SecurePassword1!')).toBe(false);
    expect(service.matches(proof, 'user-id', 'device-id', 'WrongPassword1!')).toBe(false);
    expect(proof).not.toContain('SecurePassword1!');
  });
});
