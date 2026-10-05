import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { SimulationService } from '@/modules/simulation/services/simulation.service';
import { HomeCacheService } from '@/modules/home/services/home-cache.service';
import { CreateTransferDto } from '@/modules/transfers/dto/create-transfer.dto';
import { TransfersRepository } from '@/modules/transfers/repositories/transfers.repository';
import {
  TransferDomainError,
  TransferFailureReason,
} from '@/modules/transfers/types/transfer.types';

@Injectable()
export class TransfersService {
  constructor(
    private readonly simulation: SimulationService,
    private readonly repository: TransfersRepository,
    private readonly homeCache: HomeCacheService,
  ) {}
  async health() {
    await this.simulation.apply('transfers');
    return { status: 'ok', service: 'transfers' };
  }
  async create(userId: string, dto: CreateTransferDto) {
    await this.simulation.apply('transfers');
    try {
      const transfer = await this.repository.executeInternal(userId, dto);
      await this.homeCache.invalidate(userId);
      return {
        id: transfer.id,
        status: transfer.status,
        fromAccountId: transfer.sourceAccountId,
        toAccountId: transfer.destinationAccountId,
        amount: transfer.amount.toFixed(2),
        currency: transfer.currency,
        createdAt: transfer.createdAt.toISOString(),
        completedAt: transfer.completedAt?.toISOString(),
      };
    } catch (error) {
      if (!(error instanceof TransferDomainError)) throw error;
      this.throwHttpError(error.reason);
    }
  }

  private throwHttpError(reason: TransferFailureReason): never {
    if (reason === TransferFailureReason.ACCOUNT_UNAVAILABLE) {
      throw new BadRequestException({
        code: reason,
        message: 'La cuenta no admite esta operación',
      });
    }
    if (
      reason === TransferFailureReason.SOURCE_NOT_FOUND ||
      reason === TransferFailureReason.DESTINATION_NOT_FOUND
    ) {
      throw new NotFoundException('Cuenta de origen o destino no encontrada');
    }
    if (reason === TransferFailureReason.INSUFFICIENT_FUNDS) {
      throw new BadRequestException('Saldo insuficiente');
    }
    if (reason === TransferFailureReason.CURRENCY_MISMATCH) {
      throw new BadRequestException('Las cuentas deben utilizar la misma moneda');
    }
    throw new BadRequestException('La cuenta de origen y destino deben ser diferentes');
  }
}
