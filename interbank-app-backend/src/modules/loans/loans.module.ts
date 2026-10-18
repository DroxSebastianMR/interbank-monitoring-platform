import { Module } from '@nestjs/common';
import { AuthModule } from '@/modules/auth/auth.module';
import { LoansController } from '@/modules/loans/controllers/loans.controller';
import { LoansRepository } from '@/modules/loans/repositories/loans.repository';
import { LoansService } from '@/modules/loans/services/loans.service';

@Module({
  imports: [AuthModule],
  controllers: [LoansController],
  providers: [LoansService, LoansRepository],
})
export class LoansModule {}
