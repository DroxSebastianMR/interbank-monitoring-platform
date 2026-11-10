import { Controller, Get, Header, Patch, Param, ParseUUIDPipe, Query, UseGuards } from '@nestjs/common';
import { CurrentEmployee } from '@/modules/auth/decorators/current-employee.decorator';
import type { EmployeePrincipal } from '@/modules/auth/types/auth.types';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '@/modules/auth/decorators/require-permissions.decorator';
import { PermissionCode } from '@/modules/auth/enums/permission-code.enum';
import { JwtAccessGuard } from '@/modules/auth/guards/jwt-access.guard';
import { PermissionsGuard } from '@/modules/auth/guards/permissions.guard';
import { NotificationsService } from '@/modules/notifications/services/notifications.service';
import { NotificationInboxQueryDto } from '@/modules/notifications/dto/notification-inbox-query.dto';
import { NotificationInboxPageDto, UnreadNotificationsCountDto } from '@/modules/notifications/dto/notification-inbox-response.dto';
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

  @Get('unread-count')
  @Header('Cache-Control', 'no-store')
  @RequirePermissions(PermissionCode.NOTIFICATIONS_READ, PermissionCode.INCIDENTS_READ)
  @ApiOperation({ summary: 'Contar todas las notificaciones propias no leídas' })
  @ApiOkResponse({ type: UnreadNotificationsCountDto })
  unreadCount(@CurrentEmployee() employee: EmployeePrincipal): Promise<UnreadNotificationsCountDto> {
    return this.service.unreadCount(employee.id);
  }

  @Get('inbox')
  @Header('Cache-Control', 'no-store')
  @RequirePermissions(PermissionCode.NOTIFICATIONS_READ, PermissionCode.INCIDENTS_READ)
  @ApiOperation({ summary: 'Consultar la bandeja propia con paginación y resumen del incidente' })
  @ApiOkResponse({ type: NotificationInboxPageDto })
  inbox(@CurrentEmployee() employee: EmployeePrincipal, @Query() query: NotificationInboxQueryDto): Promise<NotificationInboxPageDto> {
    return this.service.inbox(employee.id, query);
  }

  @Patch(':id/read')
  @RequirePermissions(PermissionCode.NOTIFICATIONS_READ, PermissionCode.INCIDENTS_READ)
  markRead(@CurrentEmployee() employee: EmployeePrincipal, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.markRead(employee.id, id);
  }
}
