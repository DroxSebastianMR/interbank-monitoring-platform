import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '@/modules/auth/decorators/require-permissions.decorator';
import { PermissionCode } from '@/modules/auth/enums/permission-code.enum';
import { JwtAccessGuard } from '@/modules/auth/guards/jwt-access.guard';
import { PermissionsGuard } from '@/modules/auth/guards/permissions.guard';
import { AiIntegrationService } from '@/modules/ai-integration/services/ai-integration.service';
import { PredictDto } from '@/modules/ai-integration/dto/predict.dto';
import type { AiHealth, AiResult } from '@/modules/ai-integration/types/ai-integration.types';

@ApiTags('ai-integration')
@ApiBearerAuth('access-token')
@UseGuards(JwtAccessGuard, PermissionsGuard)
@Controller('ai')
export class AiIntegrationController {
  constructor(private readonly service: AiIntegrationService) {}

  @Get('health')
  @RequirePermissions(PermissionCode.ANALYTICS_READ)
  health(): Promise<AiHealth> {
    return this.service.health();
  }

  @Post('predict')
  @RequirePermissions(PermissionCode.SERVICES_MANAGE)
  predict(@Body() dto: PredictDto): Promise<AiResult> {
    return this.service.predict(dto);
  }
}
