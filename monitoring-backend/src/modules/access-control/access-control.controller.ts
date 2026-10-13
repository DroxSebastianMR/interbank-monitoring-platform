import { Body, Controller, Get, Param, ParseUUIDPipe, Put, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentEmployee } from '@/modules/auth/decorators/current-employee.decorator';
import { RequirePermissions } from '@/modules/auth/decorators/require-permissions.decorator';
import { PermissionCode } from '@/modules/auth/enums/permission-code.enum';
import { JwtAccessGuard } from '@/modules/auth/guards/jwt-access.guard';
import { PermissionsGuard } from '@/modules/auth/guards/permissions.guard';
import type {
  EmployeePrincipal,
  HttpRequest,
  RequestMetadata,
} from '@/modules/auth/types/auth.types';
import { AccessControlService } from '@/modules/access-control/access-control.service';
import { AssignEmployeeRolesDto } from '@/modules/access-control/dto/assign-employee-roles.dto';
import {
  EmployeeRolesUpdatedDto,
  PermissionDto,
  RoleDto,
} from '@/modules/access-control/dto/access-control-response.dto';

@ApiTags('Access control')
@ApiBearerAuth('access-token')
@UseGuards(JwtAccessGuard, PermissionsGuard)
@Controller('access-control')
export class AccessControlController {
  constructor(private readonly service: AccessControlService) {}

  @Get('roles')
  @RequirePermissions(PermissionCode.ACCESS_CONTROL_READ)
  @ApiOperation({ summary: 'Listar roles internos y sus permisos' })
  @ApiOkResponse({ type: RoleDto, isArray: true })
  roles(): Promise<RoleDto[]> {
    return this.service.roles();
  }

  @Get('permissions')
  @RequirePermissions(PermissionCode.ACCESS_CONTROL_READ)
  @ApiOperation({ summary: 'Listar el catálogo de permisos operativos' })
  @ApiOkResponse({ type: PermissionDto, isArray: true })
  permissions(): Promise<PermissionDto[]> {
    return this.service.permissions();
  }

  @Put('employees/:employeeId/roles')
  @RequirePermissions(PermissionCode.ACCESS_CONTROL_MANAGE)
  @ApiOperation({ summary: 'Reemplazar los roles asignados a un empleado' })
  @ApiOkResponse({ type: EmployeeRolesUpdatedDto })
  assignRoles(
    @Param('employeeId', new ParseUUIDPipe()) employeeId: string,
    @Body() input: AssignEmployeeRolesDto,
    @CurrentEmployee() actor: EmployeePrincipal,
    @Req() request: HttpRequest,
  ): Promise<EmployeeRolesUpdatedDto> {
    return this.service.assignRoles(employeeId, input.roleCodes, actor, this.metadataFrom(request));
  }

  private metadataFrom(request: HttpRequest): RequestMetadata {
    return request.ip ? { ipAddress: request.ip } : {};
  }
}
