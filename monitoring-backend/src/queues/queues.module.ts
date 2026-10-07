import { Global, Module } from '@nestjs/common';
import { QUEUE_NAMES } from '@/queues/queues.constants';
@Global()
@Module({
  providers: [{ provide: 'QUEUE_NAMES', useValue: QUEUE_NAMES }],
  exports: ['QUEUE_NAMES'],
})
export class QueuesModule {}
