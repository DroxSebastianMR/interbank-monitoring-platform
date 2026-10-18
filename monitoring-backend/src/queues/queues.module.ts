import { Global, Module } from '@nestjs/common';
import { QUEUE_NAMES } from '@/queues/queues.constants';
import { OperationalDeliveryService } from '@/queues/operational-delivery.service';
@Global()
@Module({
  providers: [{ provide: 'QUEUE_NAMES', useValue: QUEUE_NAMES }, OperationalDeliveryService],
  exports: ['QUEUE_NAMES'],
})
export class QueuesModule {}
