import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { PublicStatusController } from '@/modules/public-status/controllers/public-status.controller';
import { PublicationOperationsController } from '@/modules/public-status/controllers/publication-operations.controller';
import { PublicStatusRepository } from '@/modules/public-status/repositories/public-status.repository';
import { PublicationWorker } from '@/modules/public-status/services/publication-worker.service';
import { PublicationOperations } from '@/modules/public-status/services/publication-operations.service';

@Module({ imports: [ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }])],
  controllers: [PublicStatusController, PublicationOperationsController],
  providers: [PublicStatusRepository, PublicationWorker, PublicationOperations] })
export class PublicStatusModule {}
