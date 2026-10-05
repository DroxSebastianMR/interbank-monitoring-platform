import { Injectable, NotFoundException } from '@nestjs/common';

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
  async list(userId: string) {
    await this.simulation.apply('accounts');
    const accounts = await this.repository.findByUser(userId);
    return accounts.map((account) => ({
      ...account,
      accountNumber: this.maskAccountNumber(account.accountNumber),
      balance: account.balance.toFixed(2),
    }));
  }

  async balance(userId: string, accountId: string) {
    await this.simulation.apply('accounts');
    const account = await this.repository.findOwnedById(userId, accountId);
    if (!account) throw new NotFoundException('Cuenta no encontrada');
    return {
      accountId: account.id,
      currency: account.currency,
      availableBalance: account.balance.toFixed(2),
    };
  }

  async transactions(userId: string, accountId: string, limit: number) {
    await this.simulation.apply('accounts');
    const account = await this.repository.findOwnedById(userId, accountId);
    if (!account) throw new NotFoundException('Cuenta no encontrada');
    const transactions = await this.repository.findTransactions(userId, accountId, limit);
    return transactions.map((transaction) => ({
      ...transaction,
      amount: transaction.amount.toFixed(2),
      occurredAt: transaction.occurredAt.toISOString(),
    }));
  }

  private maskAccountNumber(accountNumber: string): string {
    return `${'*'.repeat(Math.max(0, accountNumber.length - 4))}${accountNumber.slice(-4)}`;
  }
}
