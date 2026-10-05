import { Injectable } from '@nestjs/common';
import { AccountStatus, TransferKind } from '@prisma/client';
import {
  ListTransfersQueryDto,
  TransferSourceQueryDto,
} from '@/modules/transfers/dto/list-transfers-query.dto';
import { TransferQueryRepository } from '@/modules/transfers/repositories/transfer-query.repository';
import { TransferMapper } from '@/modules/transfers/mappers/transfer.mapper';
import { TransferPolicy } from '@/modules/transfers/policies/transfer.policy';
import { TransferExceptionFactory } from '@/modules/transfers/exceptions/transfer-exception.factory';
import { TransferFailureReason } from '@/modules/transfers/enums/transfer-failure-reason.enum';
import { SimulationService } from '@/modules/simulation/services/simulation.service';

@Injectable()
export class TransferQueryService {
  constructor(
    private readonly repository: TransferQueryRepository,
    private readonly simulation: SimulationService,
  ) {}
  async sources(userId: string, query: TransferSourceQueryDto) {
    await this.simulation.apply('transfers');
    return (await this.repository.sources(userId, query.currency)).map((a) =>
      TransferMapper.source(a),
    );
  }
  async resolve(userId: string, accountNumber: string) {
    await this.simulation.apply('transfers');
    try {
      const account = await this.repository.resolve(accountNumber);
      if (!account || account.status !== AccountStatus.ACTIVE || !account.accountType.allowsDebits)
        TransferPolicy.fail(TransferFailureReason.DESTINATION_NOT_FOUND);
      const name = [account.user.firstName, account.user.lastName?.slice(0, 1)]
        .filter(Boolean)
        .join(' ');
      return {
        ...TransferMapper.account({ ...account, displayName: account.accountType.name }),
        beneficiaryName: name || 'Titular de cuenta',
        kind: account.userId === userId ? TransferKind.OWN_ACCOUNTS : TransferKind.THIRD_PARTY,
      };
    } catch (error) {
      TransferExceptionFactory.rethrow(error);
    }
  }
  async detail(userId: string, id: string) {
    await this.simulation.apply('transfers');
    try {
      const transfer = await this.repository.detail(userId, id);
      if (!transfer) TransferPolicy.fail(TransferFailureReason.TRANSFER_NOT_FOUND);
      return TransferMapper.transfer(transfer, userId);
    } catch (error) {
      TransferExceptionFactory.rethrow(error);
    }
  }
  async history(userId: string, query: ListTransfersQueryDto) {
    await this.simulation.apply('transfers');
    try {
      if (query.from && query.to && new Date(query.from) > new Date(query.to))
        TransferPolicy.fail(TransferFailureReason.INVALID_DATE_RANGE);
      if (query.accountId && !(await this.repository.ownedAccount(userId, query.accountId)))
        TransferPolicy.fail(TransferFailureReason.SOURCE_NOT_FOUND);
      const position = query.cursor
        ? await this.repository.detail(userId, query.cursor)
        : undefined;
      if (query.cursor && !position) TransferPolicy.fail(TransferFailureReason.INVALID_CURSOR);
      const transfers = await this.repository.page(userId, query, position ?? undefined);
      const hasMore = transfers.length > query.limit;
      const items = transfers.slice(0, query.limit).map((t) => TransferMapper.transfer(t, userId));
      return { items, hasMore, nextCursor: hasMore ? items[items.length - 1].id : null };
    } catch (error) {
      TransferExceptionFactory.rethrow(error);
    }
  }
}
