import { NotFoundException } from '@nestjs/common';
import { AccountStatus, Currency } from '@prisma/client';
import { TransferQueryRepository } from '@/modules/transfers/repositories/transfer-query.repository';
import { TransferQueryService } from '@/modules/transfers/services/transfer-query.service';
import { SimulationService } from '@/modules/simulation/services/simulation.service';
import { ListTransfersQueryDto } from '@/modules/transfers/dto/list-transfers-query.dto';

describe('TransferQueryService privacy', () => {
  const repository = {
    resolve: jest.fn(),
    detail: jest.fn(),
    ownedAccount: jest.fn(),
    page: jest.fn(),
  };
  const simulation = { apply: jest.fn().mockResolvedValue(undefined) };
  const service = new TransferQueryService(
    repository as unknown as TransferQueryRepository,
    simulation as unknown as SimulationService,
  );
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it('resolves exact accounts without leaking balances, user IDs, or complete names', async () => {
    repository.resolve.mockResolvedValue({
      id: 'destination',
      userId: 'other',
      accountNumber: '2003000000001',
      displayName: 'Private nickname',
      currency: Currency.PEN,
      balance: '9999.99',
      status: AccountStatus.ACTIVE,
      accountType: { name: 'Cuenta Simple', allowsDebits: true },
      user: { firstName: 'Ana', lastName: 'Privado' },
    });
    const result = await service.resolve('sender', '2003000000001');
    expect(result).toEqual({
      id: 'destination',
      displayName: 'Cuenta Simple',
      maskedAccountNumber: '*********0001',
      currency: Currency.PEN,
      beneficiaryName: 'Ana P',
      kind: 'THIRD_PARTY',
    });
  });
  it('makes blocked and nonexistent beneficiaries indistinguishable', async () => {
    repository.resolve.mockResolvedValue(null);
    await expect(service.resolve('sender', '2003000000001')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    repository.resolve.mockResolvedValue({ status: AccountStatus.BLOCKED });
    await expect(service.resolve('sender', '2003000000001')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
  it('rejects a foreign account filter before reading history', async () => {
    repository.ownedAccount.mockResolvedValue(null);
    await expect(
      service.history('sender', { ...new ListTransfersQueryDto(), accountId: 'foreign' }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(repository.page).not.toHaveBeenCalled();
  });
  it('does not reveal a receipt to a nonparticipant', async () => {
    repository.detail.mockResolvedValue(null);
    await expect(service.detail('stranger', 'transfer')).rejects.toBeInstanceOf(NotFoundException);
  });
});
