import { Injectable } from '@nestjs/common';
import type { ListAccountsQueryDto } from '@/modules/accounts/dto/list-accounts-query.dto';
import { AccountErrorCode } from '@/modules/accounts/enums/account-error-code.enum';
import { AccountExceptionFactory } from '@/modules/accounts/exceptions/account-exception.factory';
import { AccountsMapper } from '@/modules/accounts/mappers/accounts.mapper';
import { AccountsRepository } from '@/modules/accounts/repositories/accounts.repository';
import { SimulationService } from '@/modules/simulation/services/simulation.service';

@Injectable()
export class AccountsService {
  constructor(
    private readonly simulation: SimulationService,
    private readonly repository: AccountsRepository,
  ) {}
  async health() {
    await this.simulation.apply('accounts');
    return { status: 'ok', service: 'accounts' };
  }
  async list(userId: string, query: ListAccountsQueryDto = {}) {
    await this.simulation.apply('accounts');
    const accounts = await this.repository.findByUser(userId, query);
    return accounts.map((account) => AccountsMapper.account(account));
  }
  async detail(userId: string, accountId: string) {
    await this.simulation.apply('accounts');
    return AccountsMapper.account(await this.requireOwnedAccount(userId, accountId));
  }
  async identifiers(userId: string, accountId: string) {
    await this.simulation.apply('accounts');
    return AccountsMapper.identifiers(await this.requireOwnedAccount(userId, accountId));
  }
  async balance(userId: string, accountId: string) {
    await this.simulation.apply('accounts');
    const account = await this.requireOwnedAccount(userId, accountId);
    return {
      accountId: account.id,
      currency: account.currency,
      availableBalance: account.balance.toFixed(2),
      status: account.status,
      canDebit: AccountsMapper.account(account).canDebit,
    };
  }
  async requireOwnedAccount(userId: string, accountId: string) {
    const account = await this.repository.findOwnedById(userId, accountId);
    if (!account) AccountExceptionFactory.notFound(AccountErrorCode.ACCOUNT_NOT_FOUND);
    return account;
  }
}
