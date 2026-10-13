import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

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
import { AccessControlService } from '@/modules/access-control/services/access-control.service';
import { AssignEmployeeRolesDto } from '@/modules/access-control/dto/assign-employee-roles.dto';
import { CreateEmployeeDto } from '@/modules/access-control/dto/create-employee.dto';
import { CreateRoleDto, UpdateRoleDto } from '@/modules/access-control/dto/create-role.dto';
import { UpdateEmployeeStatusDto } from '@/modules/access-control/dto/update-employee-status.dto';
import {
  EmployeeRolesUpdatedDto,
  EmployeeSummaryDto,
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

  @Get('roles/:roleId')
  @RequirePermissions(PermissionCode.ACCESS_CONTROL_READ)
  @ApiOperation({ summary: 'Consultar un rol y sus permisos' })
  @ApiOkResponse({ type: RoleDto })
  role(@Param('roleId', new ParseUUIDPipe()) roleId: string): Promise<RoleDto> {
    return this.service.role(roleId);
  }

  @Post('roles')
  @RequirePermissions(PermissionCode.ACCESS_CONTROL_MANAGE)
  @ApiOperation({ summary: 'Crear un rol personalizado con permisos del catálogo' })
  @ApiCreatedResponse({ type: RoleDto })
  createRole(
    @Body() input: CreateRoleDto,
    @CurrentEmployee() actor: EmployeePrincipal,
    @Req() request: HttpRequest,
  ): Promise<RoleDto> {
    return this.service.createRole(input, actor, this.metadataFrom(request));
  }

  @Put('roles/:roleId')
  @RequirePermissions(PermissionCode.ACCESS_CONTROL_MANAGE)
  @ApiOperation({ summary: 'Modificar permisos de un rol personalizado' })
  @ApiOkResponse({ type: RoleDto })
  updateRole(
    @Param('roleId', new ParseUUIDPipe()) roleId: string,
    @Body() input: UpdateRoleDto,
    @CurrentEmployee() actor: EmployeePrincipal,
    @Req() request: HttpRequest,
  ): Promise<RoleDto> {
    return this.service.updateRole(roleId, input, actor, this.metadataFrom(request));
  }

  @Delete('roles/:roleId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions(PermissionCode.ACCESS_CONTROL_MANAGE)
  @ApiOperation({ summary: 'Eliminar un rol personalizado sin empleados asignados' })
  @ApiNoContentResponse()
  deleteRole(
    @Param('roleId', new ParseUUIDPipe()) roleId: string,
    @CurrentEmployee() actor: EmployeePrincipal,
    @Req() request: HttpRequest,
  ): Promise<void> {
    return this.service.deleteRole(roleId, actor, this.metadataFrom(request));
  }

  @Get('permissions')
  @RequirePermissions(PermissionCode.ACCESS_CONTROL_READ)
  @ApiOperation({ summary: 'Listar el catálogo de permisos operativos' })
  @ApiOkResponse({ type: PermissionDto, isArray: true })
  permissions(): Promise<PermissionDto[]> {
    return this.service.permissions();
  }

  @Get('employees')
  @RequirePermissions(PermissionCode.EMPLOYEES_READ)
  @ApiOperation({ summary: 'Listar empleados internos sin exponer claves' })
  @ApiOkResponse({ type: EmployeeSummaryDto, isArray: true })
  employees(
    @Query('page') page = '1',
    @Query('limit') limit = '25',
  ): Promise<EmployeeSummaryDto[]> {
    const parsedPage = Number(page);
    const parsedLimit = Number(limit);
    if (
      !Number.isInteger(parsedPage) ||
      parsedPage < 1 ||
      !Number.isInteger(parsedLimit) ||
      parsedLimit < 1 ||
      parsedLimit > 100
    ) {
      throw new BadRequestException('page debe ser positivo y limit debe estar entre 1 y 100');
    }
    return this.service.employees(parsedPage, parsedLimit);
  }

  @Get('employees/:employeeId')
  @RequirePermissions(PermissionCode.EMPLOYEES_READ)
  @ApiOperation({ summary: 'Consultar un empleado interno' })
  @ApiOkResponse({ type: EmployeeSummaryDto })
  employee(
    @Param('employeeId', new ParseUUIDPipe()) employeeId: string,
  ): Promise<EmployeeSummaryDto> {
    return this.service.employee(employeeId);
  }

  @Post('employees')
  @RequirePermissions(PermissionCode.EMPLOYEES_MANAGE)
  @ApiOperation({ summary: 'Provisionar un empleado (sin registro público)' })
  @ApiCreatedResponse({ type: EmployeeSummaryDto })
  createEmployee(
    @Body() input: CreateEmployeeDto,
    @CurrentEmployee() actor: EmployeePrincipal,
    @Req() request: HttpRequest,
  ): Promise<EmployeeSummaryDto> {
    return this.service.createEmployee(input, actor, this.metadataFrom(request));
  }

  @Put('employees/:employeeId/status')
  @RequirePermissions(PermissionCode.EMPLOYEES_MANAGE)
  @ApiOperation({ summary: 'Activar o desactivar empleado y revocar sesiones al desactivar' })
  @ApiOkResponse({ type: EmployeeSummaryDto })
  updateEmployeeStatus(
    @Param('employeeId', new ParseUUIDPipe()) employeeId: string,
    @Body() input: UpdateEmployeeStatusDto,
    @CurrentEmployee() actor: EmployeePrincipal,
    @Req() request: HttpRequest,
  ): Promise<EmployeeSummaryDto> {
    return this.service.updateEmployeeStatus(
      employeeId,
      input.status,
      actor,
      this.metadataFrom(request),
    );
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
