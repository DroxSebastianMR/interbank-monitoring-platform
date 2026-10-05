import { Injectable } from '@nestjs/common';
import type { ListCardsQueryDto } from '@/modules/accounts/dto/list-cards-query.dto';
import { AccountErrorCode } from '@/modules/accounts/enums/account-error-code.enum';
import { AccountExceptionFactory } from '@/modules/accounts/exceptions/account-exception.factory';
import { AccountsMapper } from '@/modules/accounts/mappers/accounts.mapper';
import { AccountCardsRepository } from '@/modules/accounts/repositories/account-cards.repository';
import { AccountsService } from '@/modules/accounts/services/accounts.service';
import { SimulationService } from '@/modules/simulation/services/simulation.service';

@Injectable()
export class AccountCardsService {
  constructor(
    private readonly repository: AccountCardsRepository,
    private readonly accounts: AccountsService,
    private readonly simulation: SimulationService,
  ) {}
  async list(userId: string, query: ListCardsQueryDto = {}, accountId?: string) {
    await this.simulation.apply('accounts');
    if (accountId) await this.accounts.requireOwnedAccount(userId, accountId);
    return (await this.repository.findByUser(userId, query, accountId)).map((card) =>
      AccountsMapper.card(card),
    );
  }
  async detail(userId: string, cardId: string) {
    await this.simulation.apply('accounts');
    const card = await this.repository.findOwnedById(userId, cardId);
    if (!card) AccountExceptionFactory.notFound(AccountErrorCode.CARD_NOT_FOUND);
    return AccountsMapper.card(card);
  }
}
