import { Controller, Get, Header, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '@/modules/auth/decorators/require-permissions.decorator';
import { PermissionCode } from '@/modules/auth/enums/permission-code.enum';
import { JwtAccessGuard } from '@/modules/auth/guards/jwt-access.guard';
import { PermissionsGuard } from '@/modules/auth/guards/permissions.guard';
import { BankingAnalyticsService } from '@/modules/analytics/services/banking-analytics.service';
@ApiTags('Banking analytics')
@ApiBearerAuth('access-token')
@UseGuards(JwtAccessGuard, PermissionsGuard)
@RequirePermissions(PermissionCode.ANALYTICS_READ, PermissionCode.TRANSACTIONS_READ)
@Controller('analytics/banking')
export class BankingAnalyticsController {
  constructor(private readonly service: BankingAnalyticsService) {}
  @Get()
  @Header('Cache-Control', 'no-store')
  @ApiOperation({ summary: '30-day persisted business-operation aggregates; analytics.read AND transactions.read' })
  snapshot() { return this.service.snapshot(); }
}
