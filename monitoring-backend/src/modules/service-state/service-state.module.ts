import { Module } from '@nestjs/common';
import { ServiceStateService } from './service-state.service';
@Module({ providers: [ServiceStateService], exports: [ServiceStateService] })
export class ServiceStateModule {}
