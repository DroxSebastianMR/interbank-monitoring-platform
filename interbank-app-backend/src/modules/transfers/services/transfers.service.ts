import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { SimulationService } from '@/modules/simulation/services/simulation.service';
import { HomeCacheService } from '@/modules/home/services/home-cache.service';
import { CreateTransferDto } from '@/modules/transfers/dto/create-transfer.dto';
import { TransfersRepository } from '@/modules/transfers/repositories/transfers.repository';
import { TransferExceptionFactory } from '@/modules/transfers/exceptions/transfer-exception.factory';
import { TransferPolicy } from '@/modules/transfers/policies/transfer.policy';
import { TransferMapper } from '@/modules/transfers/mappers/transfer.mapper';

@Injectable()
export class TransfersService {
  private readonly logger = new Logger(TransfersService.name);
  constructor(
    private readonly simulation: SimulationService,
    private readonly repository: TransfersRepository,
    private readonly homeCache: HomeCacheService,
  ) {}
  async health() {
    await this.simulation.apply('transfers');
    return { status: 'ok', service: 'transfers' };
  }
  async create(userId: string, dto: CreateTransferDto, idempotencyKey?: string) {
    try {
      const amount = TransferPolicy.amount(dto.amount);
      const key = TransferPolicy.key(idempotencyKey);
      await this.simulation.apply('transfers');
      const result = await this.repository.executeInternal(userId, {
        fromAccountId: dto.fromAccountId.toLowerCase(),
        toAccountId: dto.toAccountId.toLowerCase(),
        amount,
        currency: dto.currency,
        description: dto.description?.trim() || undefined,
        idempotencyKey: key,
        requestFingerprint: TransferPolicy.fingerprint(dto, amount),
        operationNumber: `TRF-${randomUUID().replaceAll('-', '').slice(0, 28).toUpperCase()}`,
      });
      // A cache failure must not turn a committed transfer into a payment failure.
      const participants = new Set([
        result.transfer.userId,
        result.transfer.destinationAccount.userId,
      ]);
      const invalidations = await Promise.allSettled(
        [...participants].map((id) => this.homeCache.invalidate(id)),
      );
      if (invalidations.some((item) => item.status === 'rejected'))
        this.logger.warn('Transfer confirmed; home cache invalidation failed');
      return TransferMapper.transfer(result.transfer, userId, result.replayed);
    } catch (error) {
      TransferExceptionFactory.rethrow(error);
    }
  }
}
