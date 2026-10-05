import { Injectable } from '@nestjs/common';

import type { HomeResponseDto } from '@/modules/home/dto/home-response.dto';
import { mapHomeResponse } from '@/modules/home/mappers/home-response.mapper';
import { HomeRepository } from '@/modules/home/repositories/home.repository';
import { HomeCacheService } from '@/modules/home/services/home-cache.service';
import { SimulationService } from '@/modules/simulation/services/simulation.service';

@Injectable()
export class HomeService {
  constructor(
    private readonly repository: HomeRepository,
    private readonly simulation: SimulationService,
    private readonly cache: HomeCacheService,
  ) {}

  async getHome(userId: string): Promise<HomeResponseDto> {
    await this.simulation.apply('accounts');
    const cached = await this.cache.find(userId);
    if (cached) return cached;

    const response = mapHomeResponse(await this.repository.getSnapshot(userId));
    await this.cache.set(userId, response);
    return response;
  }
}
