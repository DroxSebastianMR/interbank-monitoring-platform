import { Module } from '@nestjs/common';
import { AuthModule } from '@/modules/auth/auth.module';
import { HomeModule } from '@/modules/home/home.module';
import { PlinController } from '@/modules/plin/controllers/plin.controller';
import { PlinRepository } from '@/modules/plin/repositories/plin.repository';
import { PlinService } from '@/modules/plin/services/plin.service';

@Module({
  imports: [AuthModule, HomeModule],
  controllers: [PlinController],
  providers: [PlinService, PlinRepository],
})
export class PlinModule {}
