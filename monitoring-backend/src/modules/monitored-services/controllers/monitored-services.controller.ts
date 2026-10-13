import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '@/modules/auth/decorators/require-permissions.decorator';
import { PermissionCode } from '@/modules/auth/enums/permission-code.enum';
import { JwtAccessGuard } from '@/modules/auth/guards/jwt-access.guard';
import { PermissionsGuard } from '@/modules/auth/guards/permissions.guard';
import { MonitoredServicesService } from '@/modules/monitored-services/services/monitored-services.service';
@ApiTags('monitored-services')
@ApiBearerAuth('access-token')
@UseGuards(JwtAccessGuard, PermissionsGuard)
@Controller('monitored-services')
export class MonitoredServicesController {
  constructor(private readonly service: MonitoredServicesService) {}
  @Get()
  @RequirePermissions(PermissionCode.SERVICES_READ)
  findAll() {
    return this.service.findAll();
  }
}
