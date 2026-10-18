import { ProfileService } from '@/modules/profile/services/profile.service';
import type { ProfileRepository } from '@/modules/profile/repositories/profile.repository';

describe('ProfileService', () => {
  const userId = '80000000-0000-4000-8000-000000000001';
  const profile = {
    id: userId,
    documentNumber: '12345678',
    email: 'demo@test.invalid',
    firstName: 'Demo',
    lastName: 'User',
    phoneNumber: null,
    phoneVerifiedAt: null,
    marketingOptIn: false,
  };
  const repository = {
    find: jest.fn().mockResolvedValue(profile),
    update: jest.fn(),
    findPhoneOwner: jest.fn().mockResolvedValue(null),
    findChallenge: jest.fn().mockResolvedValue(null),
    challenge: jest.fn(),
    incrementAttempts: jest.fn(),
    verify: jest.fn(),
  } as unknown as ProfileRepository;
  const service = new ProfileService(repository);

  it('exposes only safe profile fields', async () => {
    expect(await service.get(userId)).toEqual(profile);
    expect(await service.get(userId)).not.toHaveProperty('passwordHash');
  });

  it('does not generate a visible code outside a demo environment', async () => {
    const previous = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    try {
      await expect(service.startPhoneChallenge(userId, '987654321')).rejects.toThrow();
    } finally {
      process.env.NODE_ENV = previous;
    }
  });
});
