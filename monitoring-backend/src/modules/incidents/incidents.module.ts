import { Module } from '@nestjs/common';
import { IncidentsController } from '@/modules/incidents/controllers/incidents.controller';
import { IncidentsRepository } from '@/modules/incidents/repositories/incidents.repository';
import { IncidentsService } from '@/modules/incidents/services/incidents.service';
import { IncidentWorkflowRepository } from '@/modules/incidents/repositories/incident-workflow.repository';
@Module({
  controllers: [IncidentsController],
  providers: [IncidentsService, IncidentsRepository, IncidentWorkflowRepository],
  exports: [IncidentsService],
})
export class IncidentsModule {}
