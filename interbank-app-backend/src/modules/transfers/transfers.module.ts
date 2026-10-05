import { Module } from '@nestjs/common';

import { AuthModule } from '@/modules/auth/auth.module';
import { HomeModule } from '@/modules/home/home.module';
import { TransfersController } from '@/modules/transfers/controllers/transfers.controller';
import { TransfersRepository } from '@/modules/transfers/repositories/transfers.repository';
import { TransfersService } from '@/modules/transfers/services/transfers.service';

@Module({
  imports: [AuthModule, HomeModule],
  controllers: [TransfersController],
  providers: [TransfersService, TransfersRepository],
})
export class TransfersModule {}
