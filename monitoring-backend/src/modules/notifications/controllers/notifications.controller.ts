import { Controller, Get, Patch, Param, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { CurrentEmployee } from '@/modules/auth/decorators/current-employee.decorator';
import type { EmployeePrincipal } from '@/modules/auth/types/auth.types';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '@/modules/auth/decorators/require-permissions.decorator';
import { PermissionCode } from '@/modules/auth/enums/permission-code.enum';
import { JwtAccessGuard } from '@/modules/auth/guards/jwt-access.guard';
import { PermissionsGuard } from '@/modules/auth/guards/permissions.guard';
import { NotificationsService } from '@/modules/notifications/services/notifications.service';
@ApiTags('Notifications')
@ApiBearerAuth('access-token')
@UseGuards(JwtAccessGuard, PermissionsGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}
  @RequirePermissions(PermissionCode.NOTIFICATIONS_READ, PermissionCode.INCIDENTS_READ)
  @Get()
  all(@CurrentEmployee() employee: EmployeePrincipal) {
    return this.service.findAll(employee.id);
  }
  @Patch(':id/read')
  @RequirePermissions(PermissionCode.NOTIFICATIONS_READ, PermissionCode.INCIDENTS_READ)
  markRead(@CurrentEmployee() employee: EmployeePrincipal, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.markRead(employee.id, id);
  }
}
