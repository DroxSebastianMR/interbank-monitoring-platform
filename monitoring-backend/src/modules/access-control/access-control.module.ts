import { Module } from '@nestjs/common';

import { AuthModule } from '@/modules/auth/auth.module';
import { AccessControlController } from '@/modules/access-control/access-control.controller';
import { AccessControlService } from '@/modules/access-control/access-control.service';
import { AccessControlRepository } from '@/modules/access-control/repositories/access-control.repository';

@Module({
  imports: [AuthModule],
  controllers: [AccessControlController],
  providers: [AccessControlService, AccessControlRepository],
})
export class AccessControlModule {}
