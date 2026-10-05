import { Module } from '@nestjs/common';

import { AccountsController } from '@/modules/accounts/controllers/accounts.controller';
import { AccountsRepository } from '@/modules/accounts/repositories/accounts.repository';
import { AccountsService } from '@/modules/accounts/services/accounts.service';
import { AuthModule } from '@/modules/auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [AccountsController],
  providers: [AccountsService, AccountsRepository],
})
export class AccountsModule {}
