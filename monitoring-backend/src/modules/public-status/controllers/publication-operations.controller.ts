import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAccessGuard } from '@/modules/auth/guards/jwt-access.guard';
import { PermissionsGuard } from '@/modules/auth/guards/permissions.guard';
import { RequirePermissions } from '@/modules/auth/decorators/require-permissions.decorator';
import { CurrentEmployee } from '@/modules/auth/decorators/current-employee.decorator';
import type { EmployeePrincipal } from '@/modules/auth/types/auth.types';
import { PermissionCode as Permission } from '@/modules/auth/enums/permission-code.enum';
import { PublicationOperations } from '@/modules/public-status/services/publication-operations.service';
import { ApprovePreventiveNoticeDto } from '@/modules/public-status/dto/approve-preventive-notice.dto';

@ApiTags('Status publications')
@ApiBearerAuth('access-token')
@Controller('status-publications')
@UseGuards(JwtAccessGuard, PermissionsGuard)
export class PublicationOperationsController {
  constructor(private readonly service: PublicationOperations) {}
  @Get()
  @RequirePermissions(Permission.INCIDENTS_READ)
  history(@Query('incidentId', ParseUUIDPipe) incidentId: string) { return this.service.history(incidentId); }

  @Post(':id/retry')
  @RequirePermissions(Permission.INCIDENTS_READ, Permission.NOTIFICATIONS_MANAGE)
  retry(@Param('id', ParseUUIDPipe) id: string, @CurrentEmployee() actor: EmployeePrincipal) { return this.service.retry(id, actor.id); }

  @Post('preventive')
  @RequirePermissions(Permission.SERVICES_READ, Permission.NOTIFICATIONS_MANAGE)
  approve(@Body() input: ApprovePreventiveNoticeDto, @CurrentEmployee() actor: EmployeePrincipal) { return this.service.approve(input, actor.id); }
}
