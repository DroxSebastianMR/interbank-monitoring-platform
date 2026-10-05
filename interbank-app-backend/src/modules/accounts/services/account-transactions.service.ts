import { Injectable } from '@nestjs/common';
import { ListTransactionsQueryDto } from '@/modules/accounts/dto/list-transactions-query.dto';
import { AccountErrorCode } from '@/modules/accounts/enums/account-error-code.enum';
import { AccountExceptionFactory } from '@/modules/accounts/exceptions/account-exception.factory';
import { AccountsMapper } from '@/modules/accounts/mappers/accounts.mapper';
import { AccountTransactionsRepository } from '@/modules/accounts/repositories/account-transactions.repository';
import { AccountsService } from '@/modules/accounts/services/accounts.service';
import { SimulationService } from '@/modules/simulation/services/simulation.service';

@Injectable()
export class AccountTransactionsService {
  constructor(
    private readonly repository: AccountTransactionsRepository,
    private readonly accounts: AccountsService,
    private readonly simulation: SimulationService,
  ) {}
  async page(userId: string, accountId: string, query: ListTransactionsQueryDto) {
    await this.simulation.apply('accounts');
    await this.accounts.requireOwnedAccount(userId, accountId);
    if (query.from && query.to && new Date(query.from) > new Date(query.to))
      AccountExceptionFactory.badRequest(AccountErrorCode.INVALID_DATE_RANGE);
    const position = query.cursor
      ? await this.repository.findPosition(userId, accountId, query.cursor)
      : undefined;
    if (query.cursor && !position)
      AccountExceptionFactory.badRequest(AccountErrorCode.INVALID_TRANSACTION_CURSOR);
    const rows = await this.repository.findPage(userId, accountId, query, position ?? undefined);
    const hasMore = rows.length > query.limit;
    const items = rows.slice(0, query.limit).map((row) => AccountsMapper.transaction(row));
    return { items, nextCursor: hasMore ? items[items.length - 1].id : null, hasMore };
  }
  async list(userId: string, accountId: string, query: ListTransactionsQueryDto) {
    return (await this.page(userId, accountId, query)).items;
  }
}
