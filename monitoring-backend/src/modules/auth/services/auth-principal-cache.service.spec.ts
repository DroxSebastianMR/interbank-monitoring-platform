import type { EmployeeAccessProfile } from '@/modules/auth/types/auth.types';
import { AuthPrincipalCacheService } from '@/modules/auth/services/auth-principal-cache.service';
import type { RedisService } from '@/redis/redis.service';

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

describe('AuthPrincipalCacheService', () => {
  const chain = {
    set: jest.fn().mockReturnThis(),
    sadd: jest.fn().mockReturnThis(),
    expire: jest.fn().mockReturnThis(),
    del: jest.fn().mockReturnThis(),
    srem: jest.fn().mockReturnThis(),
    exec: jest.fn(),
  };
  const client = {
    get: jest.fn(),
    multi: jest.fn(() => chain),
    smembers: jest.fn(),
    del: jest.fn(),
  };
  const service = new AuthPrincipalCacheService({ client } as unknown as RedisService);

  beforeEach(() => jest.clearAllMocks());

  it('returns a valid principal for the expected employee', async () => {
    client.get.mockResolvedValueOnce(JSON.stringify(profile));

    await expect(service.get('session-1', profile.id)).resolves.toEqual(profile);
  });

  it('ignores a principal belonging to another employee', async () => {
    client.get.mockResolvedValueOnce(JSON.stringify(profile));

    await expect(service.get('session-1', 'employee-2')).resolves.toBeNull();
  });

  it('fails open to PostgreSQL when Redis is unavailable', async () => {
    client.get.mockRejectedValueOnce(new Error('offline'));

    await expect(service.get('session-1', profile.id)).resolves.toBeNull();
  });
});
