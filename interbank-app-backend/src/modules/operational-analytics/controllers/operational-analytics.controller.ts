import { Controller, Get, Header, UseGuards } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AnalyticsTokenGuard } from '@/modules/operational-analytics/guards/analytics-token.guard';
import { OperationalAnalyticsService } from '@/modules/operational-analytics/services/operational-analytics.service';

@ApiTags('Internal operational analytics')
@ApiHeader({ name: 'X-Monitor-Token', required: true })
@UseGuards(AnalyticsTokenGuard)
@Controller('internal/operational-analytics')
export class OperationalAnalyticsController {
  constructor(private readonly service: OperationalAnalyticsService) {}
  @Get()
  @Header('Cache-Control', 'no-store')
  @ApiOperation({ summary: 'Aggregate persisted business operations, no customer identifiers; internal network only' })
  snapshot() { return this.service.snapshot(); }
}
