import type { ExecutionContext } from '@nestjs/common';
import type { JwtService } from '@nestjs/jwt';

import { JwtAccessGuard } from '@/modules/auth/guards/jwt-access.guard';
import type { AuthRepository } from '@/modules/auth/repositories/auth.repository';
import type { AuthPrincipalCacheService } from '@/modules/auth/services/auth-principal-cache.service';
import type { EmployeeAccessProfile } from '@/modules/auth/types/auth.types';

const profile: EmployeeAccessProfile = {
  id: 'employee-1',
  employeeCode: 'EMP-001',
  corporateEmail: 'operator@interbank.test',
  firstName: 'Ana',
  lastName: 'Torres',
  jobTitle: 'SRE',
  department: 'TI',
  roles: ['OPERATOR'],
  permissions: ['dashboard.read'],
};

describe('JwtAccessGuard', () => {
  const request = { headers: { authorization: 'Bearer access-token' } } as Record<string, unknown>;
  const jwt = {
    verifyAsync: jest.fn().mockResolvedValue({
      sub: profile.id,
      email: profile.corporateEmail,
      sessionId: 'session-1',
      type: 'access',
    }),
  };
  const repository = { findPrincipalBySession: jest.fn() };
  const principalCache = { get: jest.fn(), set: jest.fn() };
  const context = {
    switchToHttp: () => ({ getRequest: () => request }),
  } as ExecutionContext;
  const guard = new JwtAccessGuard(
    jwt as unknown as JwtService,
    repository as unknown as AuthRepository,
    principalCache as unknown as AuthPrincipalCacheService,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    delete request.user;
  });

  it('authorizes from Redis without querying PostgreSQL', async () => {
    principalCache.get.mockResolvedValueOnce(profile);

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(repository.findPrincipalBySession).not.toHaveBeenCalled();
    expect(principalCache.set).not.toHaveBeenCalled();
    expect(request.user).toEqual({ ...profile, sessionId: 'session-1' });
  });

  it('falls back to PostgreSQL and warms the cache', async () => {
    principalCache.get.mockResolvedValueOnce(null);
    repository.findPrincipalBySession.mockResolvedValueOnce(profile);

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(repository.findPrincipalBySession).toHaveBeenCalledWith('session-1', profile.id);
    expect(principalCache.set).toHaveBeenCalledWith('session-1', profile);
  });
});
