import { Global, Module } from '@nestjs/common';
import { OperationalEventsService } from '@/modules/realtime/services/operational-events.service';
import { OperationalGateway } from '@/modules/realtime/gateways/operational.gateway';

@Global()
@Module({
  providers: [OperationalEventsService, OperationalGateway],
  exports: [OperationalEventsService],
})
export class RealtimeModule {}
