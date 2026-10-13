import { Module } from '@nestjs/common';
import { IncidentsController } from '@/modules/incidents/incidents.controller';
import { IncidentsService } from '@/modules/incidents/incidents.service';
@Module({
  controllers: [IncidentsController],
  providers: [IncidentsService],
  exports: [IncidentsService],
})
export class IncidentsModule {}
