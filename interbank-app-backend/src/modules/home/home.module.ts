import { Module } from '@nestjs/common';

import { AuthModule } from '@/modules/auth/auth.module';
import { HomeController } from '@/modules/home/controllers/home.controller';
import { HomeRepository } from '@/modules/home/repositories/home.repository';
import { HomeService } from '@/modules/home/services/home.service';
import { HomeCacheService } from '@/modules/home/services/home-cache.service';

@Module({
  imports: [AuthModule],
  controllers: [HomeController],
  providers: [HomeService, HomeRepository, HomeCacheService],
  exports: [HomeCacheService],
})
export class HomeModule {}
