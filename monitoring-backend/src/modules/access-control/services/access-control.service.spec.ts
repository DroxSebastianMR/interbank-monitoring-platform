import { ForbiddenException } from '@nestjs/common';

import type { AccessControlRepository } from '@/modules/access-control/repositories/access-control.repository';
import { AccessControlService } from '@/modules/access-control/services/access-control.service';
import type { AuthRepository } from '@/modules/auth/repositories/auth.repository';
import type { PasswordService } from '@/modules/auth/services/password.service';
import type { EmployeePrincipal } from '@/modules/auth/types/auth.types';
import type { RedisService } from '@/redis/redis.service';
import type { AuthPrincipalCacheService } from '@/modules/auth/services/auth-principal-cache.service';

const administrator = {
  id: 'employee-1',
  roles: ['ADMINISTRATOR'],
  permissions: ['access-control.manage'],
} as EmployeePrincipal;

describe('AccessControlService', () => {
  const repository = {
    findRoles: jest.fn(),
    findPermissions: jest.fn(),
    createRole: jest.fn(),
  };
  const redis = { client: { get: jest.fn(), set: jest.fn(), del: jest.fn() } };
  const principalCache = { invalidateEmployee: jest.fn() };
  const service = new AccessControlService(
    repository as unknown as AccessControlRepository,
    {} as AuthRepository,
    {} as PasswordService,
    redis as unknown as RedisService,
    principalCache as unknown as AuthPrincipalCacheService,
  );

  beforeEach(() => jest.clearAllMocks());

  it('denies access administration to non-administrators even with a delegated permission', async () => {
    const actor = { ...administrator, roles: ['VIEWER'] };
    await expect(
      service.createRole(
        { code: 'TEST_ROLE', name: 'Test role', permissionCodes: ['dashboard.read'] },
        actor,
        {},
      ),
    ).rejects.toThrow(ForbiddenException);
    expect(repository.createRole).not.toHaveBeenCalled();
  });

  it('reads the role catalog from PostgreSQL when Redis is unavailable', async () => {
    redis.client.get.mockRejectedValueOnce(new Error('offline'));
    redis.client.set.mockRejectedValueOnce(new Error('offline'));
    repository.findRoles.mockResolvedValueOnce([{ id: 'role-1', code: 'VIEWER' }]);

    await expect(service.roles()).resolves.toEqual([{ id: 'role-1', code: 'VIEWER' }]);
    expect(repository.findRoles).toHaveBeenCalledTimes(1);
  });

  it('invalidates cached roles after creation', async () => {
    const role = { id: 'role-1', code: 'TEST_ROLE' };
    repository.createRole.mockResolvedValueOnce(role);
    redis.client.del.mockResolvedValueOnce(1);

    await expect(
      service.createRole(
        { code: 'TEST_ROLE', name: 'Test role', permissionCodes: ['dashboard.read'] },
        administrator,
        {},
      ),
    ).resolves.toEqual(role);
    expect(redis.client.del).toHaveBeenCalledWith('monitoring:access-control:roles:v1');
  });
});
