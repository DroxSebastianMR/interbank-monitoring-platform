import { Global, Module } from '@nestjs/common';

import { SimulationController } from '@/modules/simulation/controllers/simulation.controller';
import { SimulationService } from '@/modules/simulation/services/simulation.service';

@Global()
@Module({
  controllers: [SimulationController],
  providers: [SimulationService],
  exports: [SimulationService],
})
export class SimulationModule {}
