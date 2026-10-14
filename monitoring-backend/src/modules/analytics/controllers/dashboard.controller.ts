import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { RequirePermissions } from '@/modules/auth/decorators/require-permissions.decorator';
import { PermissionCode } from '@/modules/auth/enums/permission-code.enum';
import { JwtAccessGuard } from '@/modules/auth/guards/jwt-access.guard';
import { PermissionsGuard } from '@/modules/auth/guards/permissions.guard';
import { DashboardService } from '@/modules/analytics/services/dashboard.service';
import {
  DashboardActivityQueryDto,
  DashboardMetricsQueryDto,
} from '@/modules/analytics/dto/dashboard-query.dto';

@ApiTags('Dashboard')
@ApiBearerAuth('access-token')
@UseGuards(JwtAccessGuard, PermissionsGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  @Get('overview')
  @RequirePermissions(PermissionCode.DASHBOARD_READ)
  @ApiOperation({ summary: 'Resumen operativo con fuentes reales y ausencia de datos explícita' })
  overview() {
    return this.service.overview();
  }

  @Get('metrics')
  @RequirePermissions(PermissionCode.ANALYTICS_READ)
  @ApiOperation({ summary: 'Series de sondas persistidas; no representa el tráfico HTTP' })
  metrics(@Query() query: DashboardMetricsQueryDto) {
    return this.service.metrics(query);
  }

  @Get('activity')
  @RequirePermissions(PermissionCode.DASHBOARD_READ)
  @ApiOperation({ summary: 'Actividad reciente basada en incidentes y alertas persistidos' })
  activity(@Query() query: DashboardActivityQueryDto) {
    return this.service.activity(query.limit);
  }

  @Get('topology')
  @RequirePermissions(PermissionCode.DASHBOARD_READ)
  @ApiOperation({ summary: 'Topología configurada; estado de instancias no instrumentado' })
  topology() {
    return this.service.topology();
  }
}
