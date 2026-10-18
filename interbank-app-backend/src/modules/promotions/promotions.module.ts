import { Module } from '@nestjs/common';
import { AuthModule } from '@/modules/auth/auth.module';
import { PromotionsController } from '@/modules/promotions/controllers/promotions.controller';
import { PromotionsRepository } from '@/modules/promotions/repositories/promotions.repository';
import { PromotionsService } from '@/modules/promotions/services/promotions.service';

@Module({
  imports: [AuthModule],
  controllers: [PromotionsController],
  providers: [PromotionsService, PromotionsRepository],
})
export class PromotionsModule {}
