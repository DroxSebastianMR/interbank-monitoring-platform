import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { AskAssistantDto } from '@/modules/assistant/dto/ask-assistant.dto';
import { AssistantService } from '@/modules/assistant/services/assistant.service';
import type { AssistantAnswer } from '@/modules/ai-integration/types/ai-integration.types';
import { RequirePermissions } from '@/modules/auth/decorators/require-permissions.decorator';
import { PermissionCode } from '@/modules/auth/enums/permission-code.enum';
import { JwtAccessGuard } from '@/modules/auth/guards/jwt-access.guard';
import { PermissionsGuard } from '@/modules/auth/guards/permissions.guard';

@ApiTags('assistant')
@ApiBearerAuth('access-token')
@Controller('assistant')
@UseGuards(JwtAccessGuard, PermissionsGuard, ThrottlerGuard)
export class AssistantController {
  constructor(private readonly service: AssistantService) {}

  @Post('ask')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @RequirePermissions(PermissionCode.ANALYTICS_READ)
  ask(@Body() dto: AskAssistantDto): Promise<AssistantAnswer> {
    return this.service.ask(dto.question);
  }
}
