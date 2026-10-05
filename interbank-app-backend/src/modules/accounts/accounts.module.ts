import { Module } from '@nestjs/common';

import { AccountsController } from '@/modules/accounts/controllers/accounts.controller';
import { AccountsRepository } from '@/modules/accounts/repositories/accounts.repository';
import { AccountsService } from '@/modules/accounts/services/accounts.service';
import { AccountCatalogRepository } from '@/modules/accounts/repositories/account-catalog.repository';
import { AccountCardsRepository } from '@/modules/accounts/repositories/account-cards.repository';
import { AccountTransactionsRepository } from '@/modules/accounts/repositories/account-transactions.repository';
import { AccountCatalogService } from '@/modules/accounts/services/account-catalog.service';
import { AccountCardsService } from '@/modules/accounts/services/account-cards.service';
import { AccountTransactionsService } from '@/modules/accounts/services/account-transactions.service';
import { AuthModule } from '@/modules/auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [AccountsController],
  providers: [
    AccountsService,
    AccountsRepository,
    AccountCatalogRepository,
    AccountCardsRepository,
    AccountTransactionsRepository,
    AccountCatalogService,
    AccountCardsService,
    AccountTransactionsService,
  ],
})
export class AccountsModule {}
