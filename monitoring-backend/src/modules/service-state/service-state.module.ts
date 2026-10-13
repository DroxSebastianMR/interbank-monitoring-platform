import { Module } from '@nestjs/common';
import { ServiceStateService } from '@/modules/service-state/service-state.service';
@Module({ providers: [ServiceStateService], exports: [ServiceStateService] })
export class ServiceStateModule {}
