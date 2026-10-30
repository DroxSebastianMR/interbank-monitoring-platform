import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentEmployee } from '@/modules/auth/decorators/current-employee.decorator';
import type { EmployeePrincipal } from '@/modules/auth/types/auth.types';
import { RequirePermissions } from '@/modules/auth/decorators/require-permissions.decorator';
import { PermissionCode } from '@/modules/auth/enums/permission-code.enum';
import { JwtAccessGuard } from '@/modules/auth/guards/jwt-access.guard';
import { PermissionsGuard } from '@/modules/auth/guards/permissions.guard';
import {
  ChecksQueryDto,
  CreateMonitoredServiceDto,
  PauseMonitoredServiceDto,
  UpdateMonitoredServiceDto,
  ValidateTargetDto,
} from '@/modules/monitored-services/dto/service-config.dto';
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
    return this.service.observedAll();
  }

  @Post('validate-target')
  @RequirePermissions(PermissionCode.SERVICES_MANAGE)
  @ApiOperation({ summary: 'Validar una ruta health relativa sin acceder a destinos arbitrarios' })
  validateTarget(@Body() input: ValidateTargetDto) {
    return this.service.validateTarget(input.endpoint);
  }

  @Post()
  @RequirePermissions(PermissionCode.SERVICES_MANAGE)
  @ApiOperation({ summary: 'Registrar un servicio del backend bancario configurado' })
  create(@Body() input: CreateMonitoredServiceDto, @CurrentEmployee() actor: EmployeePrincipal) {
    return this.service.create(input, actor.id);
  }

  @Get(':id')
  @RequirePermissions(PermissionCode.SERVICES_READ)
  detail(@Param('id') id: string) {
    return this.service.observed(id);
  }

  @Patch(':id')
  @RequirePermissions(PermissionCode.SERVICES_MANAGE)
  @ApiOperation({ summary: 'Editar configuración con versión esperada y auditoría' })
  update(
    @Param('id') id: string,
    @Body() input: UpdateMonitoredServiceDto,
    @CurrentEmployee() actor: EmployeePrincipal,
  ) {
    return this.service.change(id, input, actor.id);
  }

  @Get(':id/state')
  @RequirePermissions(PermissionCode.SERVICES_READ)
  state(@Param('id') id: string) {
    return this.service.observed(id);
  }

  @Get(':id/metrics')
  @RequirePermissions(PermissionCode.ANALYTICS_READ)
  @ApiOperation({
    summary: 'Métricas históricas de sondas persistidas; tráfico no disponible aquí',
  })
  metrics(@Param('id') id: string, @Query() query: ChecksQueryDto) {
    return this.service.metrics(id, query.limit);
  }

  @Get(':id/instances')
  @RequirePermissions(PermissionCode.SERVICES_READ)
  @ApiOperation({ summary: 'Instancias configuradas; estado individual sin instrumentar' })
  instances(@Param('id') id: string) {
    return this.service.instances(id);
  }

  @Get(':id/checks')
  @RequirePermissions(PermissionCode.SERVICES_READ)
  checks(@Param('id') id: string, @Query() query: ChecksQueryDto) {
    return this.service.checks(id, query.limit);
  }

  @Get(':id/state-history')
  @RequirePermissions(PermissionCode.SERVICES_READ)
  stateHistory(@Param('id') id: string, @Query() query: ChecksQueryDto) {
    return this.service.stateHistory(id, query.limit);
  }

  @Get(':id/config-history')
  @RequirePermissions(PermissionCode.SERVICES_READ)
  configHistory(@Param('id') id: string, @Query() query: ChecksQueryDto) {
    return this.service.configHistory(id, query.limit);
  }

  @Post(':id/pause')
  @RequirePermissions(PermissionCode.SERVICES_MANAGE)
  pause(
    @Param('id') id: string,
    @Body() input: PauseMonitoredServiceDto,
    @CurrentEmployee() actor: EmployeePrincipal,
  ) {
    return this.service.setMonitoringEnabled(id, false, input.reason, actor.id);
  }

  @Post(':id/resume')
  @RequirePermissions(PermissionCode.SERVICES_MANAGE)
  resume(@Param('id') id: string, @CurrentEmployee() actor: EmployeePrincipal) {
    return this.service.setMonitoringEnabled(id, true, 'Reanudación autorizada', actor.id);
  }
}
