import { Controller, Get, Header, UseGuards } from '@nestjs/common';
import { EndpointStreamService } from '@/modules/endpoint-observability/services/endpoint-stream.service';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { RequirePermissions } from '@/modules/auth/decorators/require-permissions.decorator';
import { PermissionCode } from '@/modules/auth/enums/permission-code.enum';
import { JwtAccessGuard } from '@/modules/auth/guards/jwt-access.guard';
import { PermissionsGuard } from '@/modules/auth/guards/permissions.guard';
import {
  EndpointSnapshotDto,
  LiveEndpointSnapshotDto,
} from '@/modules/endpoint-observability/dto/endpoint-snapshot.dto';
import { EndpointObservabilityService } from '@/modules/endpoint-observability/services/endpoint-observability.service';

@ApiTags('Endpoint observability')
@ApiBearerAuth('access-token')
@UseGuards(JwtAccessGuard, PermissionsGuard)
@RequirePermissions(PermissionCode.ANALYTICS_READ)
@Controller('endpoint-observability')
export class EndpointObservabilityController {
  constructor(
    private readonly service: EndpointObservabilityService,
    private readonly stream: EndpointStreamService,
  ) {}

  @Get('snapshot')
  @Header('Cache-Control', 'no-store')
  @ApiOperation({
    summary: 'Snapshot inicial con cursor para sincronización WebSocket; analytics.read',
  })
  @ApiOkResponse({ type: LiveEndpointSnapshotDto })
  liveSnapshot() {
    return this.stream.snapshot();
  }

  @Get()
  @Header('Cache-Control', 'no-store')
  @ApiOperation({
    summary:
      'Catálogo automático y métricas por operación e instancia; no ejecuta operaciones bancarias',
  })
  @ApiOkResponse({ type: EndpointSnapshotDto })
  @ApiUnauthorizedResponse({ description: 'Sesión requerida' })
  @ApiForbiddenResponse({ description: 'Requiere analytics.read' })
  snapshot(): Promise<EndpointSnapshotDto> {
    return this.service.snapshot();
  }
}
