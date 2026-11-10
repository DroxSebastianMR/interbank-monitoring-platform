import { BadRequestException, Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '@/modules/auth/decorators/require-permissions.decorator';
import { CurrentEmployee } from '@/modules/auth/decorators/current-employee.decorator';
import type { EmployeePrincipal } from '@/modules/auth/types/auth.types';
import { PermissionCode as Permission } from '@/modules/auth/enums/permission-code.enum';
import { JwtAccessGuard } from '@/modules/auth/guards/jwt-access.guard';
import { PermissionsGuard } from '@/modules/auth/guards/permissions.guard';
import { IncidentsService } from '@/modules/incidents/services/incidents.service';
import { IncidentAction as Action } from '@/modules/incidents/enums/incident-workflow.enum';
import { IncidentCommandDto, AssignIncidentDto, AddIncidentNoteDto, TransitionIncidentDto, ReclassifyIncidentDto, CloseIncidentDto } from '@/modules/incidents/dto/incident-action.dto';

@ApiTags('Incidents')
@ApiBearerAuth('access-token')
@UseGuards(JwtAccessGuard, PermissionsGuard)
@Controller('incidents')
export class IncidentsController {
  constructor(private readonly service: IncidentsService) {}

  @Get()
  @RequirePermissions(Permission.INCIDENTS_READ)
  all() { return this.service.findAll(); }

  @Get('assignees')
  @RequirePermissions(Permission.INCIDENTS_READ, Permission.INCIDENTS_MANAGE)
  assignees() { return this.service.assignees(); }

  @Get(':id')
  @RequirePermissions(Permission.INCIDENTS_READ)
  detail(@Param('id', ParseUUIDPipe) id: string) { return this.service.detail(id); }

  @Get(':id/events')
  @RequirePermissions(Permission.INCIDENTS_READ)
  events(@Param('id', ParseUUIDPipe) id: string, @Query('beforeVersion') before?: string) {
    const version = before === undefined ? undefined : Number(before);
    if (version !== undefined && (!Number.isInteger(version) || version < 1)) throw new BadRequestException('beforeVersion debe ser un entero positivo');
    return this.service.timeline(id, version);
  }

  @Patch(':id/assignment')
  @RequirePermissions(Permission.INCIDENTS_READ, Permission.INCIDENTS_MANAGE)
  assign(@Param('id', ParseUUIDPipe) id: string, @Body() input: AssignIncidentDto, @CurrentEmployee() actor: EmployeePrincipal) {
    return this.service.command(id, actor.id, { kind: Action.ASSIGN, input });
  }

  @Post(':id/acknowledgement')
  @RequirePermissions(Permission.INCIDENTS_READ, Permission.INCIDENTS_MANAGE)
  acknowledge(@Param('id', ParseUUIDPipe) id: string, @Body() input: IncidentCommandDto, @CurrentEmployee() actor: EmployeePrincipal) {
    return this.service.command(id, actor.id, { kind: Action.ACKNOWLEDGE, input });
  }

  @Post(':id/notes')
  @RequirePermissions(Permission.INCIDENTS_READ, Permission.INCIDENTS_MANAGE)
  note(@Param('id', ParseUUIDPipe) id: string, @Body() input: AddIncidentNoteDto, @CurrentEmployee() actor: EmployeePrincipal) {
    return this.service.command(id, actor.id, { kind: Action.NOTE, input });
  }

  @Patch(':id/attention')
  @RequirePermissions(Permission.INCIDENTS_READ, Permission.INCIDENTS_MANAGE)
  transition(@Param('id', ParseUUIDPipe) id: string, @Body() input: TransitionIncidentDto, @CurrentEmployee() actor: EmployeePrincipal) {
    return this.service.command(id, actor.id, { kind: Action.TRANSITION, input });
  }

  @Patch(':id/severity')
  @RequirePermissions(Permission.INCIDENTS_READ, Permission.INCIDENTS_MANAGE)
  severity(@Param('id', ParseUUIDPipe) id: string, @Body() input: ReclassifyIncidentDto, @CurrentEmployee() actor: EmployeePrincipal) {
    return this.service.command(id, actor.id, { kind: Action.RECLASSIFY, input });
  }

  @Post(':id/closure')
  @RequirePermissions(Permission.INCIDENTS_READ, Permission.INCIDENTS_MANAGE)
  close(@Param('id', ParseUUIDPipe) id: string, @Body() input: CloseIncidentDto, @CurrentEmployee() actor: EmployeePrincipal) {
    return this.service.command(id, actor.id, { kind: Action.CLOSE, input });
  }
}
