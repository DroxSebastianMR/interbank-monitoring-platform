import { Controller, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '@/modules/auth/decorators/require-permissions.decorator';
import { PermissionCode } from '@/modules/auth/enums/permission-code.enum';
import { JwtAccessGuard } from '@/modules/auth/guards/jwt-access.guard';
import { PermissionsGuard } from '@/modules/auth/guards/permissions.guard';
import { MonitoringService } from '@/modules/monitoring/services/monitoring.service';
import type { ServiceSnapshot } from '@/modules/service-state/interfaces/service-state';

@ApiTags('monitoring')
@ApiBearerAuth('access-token')
@UseGuards(JwtAccessGuard, PermissionsGuard)
@Controller('monitoring')
export class MonitoringController {
  constructor(private readonly service: MonitoringService) {}

  @Post('run')
  @RequirePermissions(PermissionCode.SERVICES_MANAGE)
  run(): Promise<ServiceSnapshot[]> {
    return this.service.runAll();
  }

  @Post(':id/check')
  @RequirePermissions(PermissionCode.SERVICES_MANAGE)
  check(@Param('id') id: string): Promise<ServiceSnapshot | undefined> {
    return this.service.check(id);
  }
}
