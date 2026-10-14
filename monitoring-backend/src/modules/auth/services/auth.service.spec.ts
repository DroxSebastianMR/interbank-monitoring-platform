import { ConfigService } from '@nestjs/config';

import { AuthService } from '@/modules/auth/services/auth.service';
import type { AuthRepository } from '@/modules/auth/repositories/auth.repository';
import type { TokenService } from '@/modules/auth/services/token.service';
import type { EmployeePrincipal } from '@/modules/auth/types/auth.types';

const principal = { id: 'employee-1', sessionId: 'session-1' } as EmployeePrincipal;

describe('AuthService security operations', () => {
  const repository = {
    findPasswordHash: jest.fn(),
    updatePasswordAndRevokeSessions: jest.fn(),
    revokeAllSessions: jest.fn(),
    listActiveSessions: jest.fn(),
  };
  const passwords = { compare: jest.fn(), hash: jest.fn() };
  const config = {
    getOrThrow: jest.fn().mockReturnValue({ maxFailedAttempts: 5, lockMinutes: 15 }),
  };
  const service = new AuthService(
    repository as unknown as AuthRepository,
    passwords,
    {} as TokenService,
    config as unknown as ConfigService,
  );

  beforeEach(() => jest.clearAllMocks());

  it('rejects a wrong current password without changing any session', async () => {
    repository.findPasswordHash.mockResolvedValueOnce('hash');
    passwords.compare.mockResolvedValueOnce(false);

    await expect(
      service.changePassword(
        principal,
        { currentPassword: 'wrong', newPassword: 'new-password-123' },
        {},
      ),
    ).rejects.toThrow();
    expect(repository.updatePasswordAndRevokeSessions).not.toHaveBeenCalled();
  });

  it('changes the password and revokes all sessions atomically', async () => {
    repository.findPasswordHash.mockResolvedValueOnce('hash');
    passwords.compare.mockResolvedValueOnce(true);
    passwords.hash.mockResolvedValueOnce('next-hash');
    repository.updatePasswordAndRevokeSessions.mockResolvedValueOnce(undefined);

    await expect(
      service.changePassword(
        principal,
        { currentPassword: 'old-password', newPassword: 'new-password-123' },
        {},
      ),
    ).resolves.toEqual({ loggedOut: true });
    expect(repository.updatePasswordAndRevokeSessions).toHaveBeenCalledWith(
      'employee-1',
      'next-hash',
      {},
    );
  });
});
