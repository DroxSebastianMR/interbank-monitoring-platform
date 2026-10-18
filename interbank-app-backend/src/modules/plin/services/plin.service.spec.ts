import { ServiceUnavailableException } from '@nestjs/common';
import { HomeCacheService } from '@/modules/home/services/home-cache.service';
import { PlinRepository } from '@/modules/plin/repositories/plin.repository';
import { PlinService } from '@/modules/plin/services/plin.service';

describe('PlinService interoperability boundary', () => {
  const repository = {
    send: jest.fn(),
    recipient: jest.fn(),
  };
  const service = new PlinService(repository as unknown as PlinRepository, {} as HomeCacheService);

  beforeEach(() => jest.clearAllMocks());

  it('never debits or records a Yape transfer without a partner connector', async () => {
    await expect(
      service.send('user-id', {
        fromAccountId: '00000000-0000-4000-8000-000000000001',
        phoneNumber: '987654321',
        network: 'YAPE',
        amount: 10,
      }),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(repository.send).not.toHaveBeenCalled();
  });

  it('marks a manually selected Yape destination as unverified', async () => {
    await expect(service.resolve('user-id', '987654321', 'YAPE')).resolves.toMatchObject({
      network: 'YAPE',
      logoKey: 'YAPE',
      verified: false,
      available: false,
    });
    expect(repository.recipient).not.toHaveBeenCalled();
  });
});
