import { Injectable } from '@nestjs/common';
import { AccountCatalogRepository } from '@/modules/accounts/repositories/account-catalog.repository';
import { SimulationService } from '@/modules/simulation/services/simulation.service';

@Injectable()
export class AccountCatalogService {
  constructor(
    private readonly repository: AccountCatalogRepository,
    private readonly simulation: SimulationService,
  ) {}
  async accountTypes() {
    await this.simulation.apply('accounts');
    return this.repository.accountTypes();
  }
  async cardTypes() {
    await this.simulation.apply('accounts');
    return this.repository.cardTypes();
  }
}
