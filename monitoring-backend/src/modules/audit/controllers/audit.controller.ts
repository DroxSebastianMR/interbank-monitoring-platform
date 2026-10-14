import { BadRequestException, Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '@/modules/auth/decorators/require-permissions.decorator';
import { PermissionCode } from '@/modules/auth/enums/permission-code.enum';
import { JwtAccessGuard } from '@/modules/auth/guards/jwt-access.guard';
import { PermissionsGuard } from '@/modules/auth/guards/permissions.guard';
import { AuditService } from '@/modules/audit/services/audit.service';
@ApiTags('Audit')
@ApiBearerAuth('access-token')
@UseGuards(JwtAccessGuard, PermissionsGuard)
@Controller('audit')
export class AuditController {
  constructor(private readonly service: AuditService) {}
  @Get()
  @RequirePermissions(PermissionCode.AUDIT_READ)
  @ApiOperation({ summary: 'Consultar eventos de auditoría recientes' })
  recent(@Query('limit') limit = '50') {
    const parsed = Number(limit);
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > 100) {
      throw new BadRequestException('limit debe estar entre 1 y 100');
    }
    return this.service.findRecent(parsed);
  }
}
