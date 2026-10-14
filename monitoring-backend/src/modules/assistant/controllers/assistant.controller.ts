import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { AskAssistantDto } from '@/modules/assistant/dto/ask-assistant.dto';
import { AssistantService } from '@/modules/assistant/services/assistant.service';
import {
  CreateConversationDto,
  MessageFeedbackDto,
  SendMessageDto,
  UpdateConversationDto,
} from '@/modules/assistant/dto/conversation.dto';
import type { AssistantAnswer } from '@/modules/ai-integration/types/ai-integration.types';
import { CurrentEmployee } from '@/modules/auth/decorators/current-employee.decorator';
import type { EmployeePrincipal } from '@/modules/auth/types/auth.types';
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
  @RequirePermissions(PermissionCode.ASSISTANT_ASK)
  @ApiOperation({ summary: 'Consulta puntual sin historial (compatibilidad)' })
  ask(@Body() dto: AskAssistantDto): Promise<AssistantAnswer> {
    return this.service.ask(dto.question);
  }

  @Post('conversations')
  @RequirePermissions(PermissionCode.ASSISTANT_ASK)
  create(@CurrentEmployee() employee: EmployeePrincipal, @Body() dto: CreateConversationDto) {
    return this.service.createConversation(employee.id, dto.title);
  }

  @Get('conversations')
  @RequirePermissions(PermissionCode.ASSISTANT_READ)
  list(@CurrentEmployee() employee: EmployeePrincipal, @Query('archived') archived?: string) {
    return this.service.listConversations(employee.id, archived === 'true');
  }

  @Get('conversations/:id')
  @RequirePermissions(PermissionCode.ASSISTANT_READ)
  get(
    @CurrentEmployee() employee: EmployeePrincipal,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.service.getConversation(id, employee.id);
  }

  @Patch('conversations/:id')
  @RequirePermissions(PermissionCode.ASSISTANT_ASK)
  update(
    @CurrentEmployee() employee: EmployeePrincipal,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateConversationDto,
  ) {
    return this.service.updateConversation(id, employee.id, dto.title, dto.archived);
  }

  @Delete('conversations/:id')
  @RequirePermissions(PermissionCode.ASSISTANT_ASK)
  remove(
    @CurrentEmployee() employee: EmployeePrincipal,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.service.deleteConversation(id, employee.id);
  }

  @Get('conversations/:id/messages')
  @RequirePermissions(PermissionCode.ASSISTANT_READ)
  messages(
    @CurrentEmployee() employee: EmployeePrincipal,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.service.listMessages(id, employee.id);
  }

  @Post('conversations/:id/messages')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @RequirePermissions(PermissionCode.ASSISTANT_ASK)
  send(
    @CurrentEmployee() employee: EmployeePrincipal,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.service.sendMessage(id, employee.id, dto.content);
  }

  @Post('messages/:id/feedback')
  @RequirePermissions(PermissionCode.ASSISTANT_READ)
  feedback(
    @CurrentEmployee() employee: EmployeePrincipal,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: MessageFeedbackDto,
  ) {
    return this.service.feedback(id, employee.id, dto.value);
  }

  @Get('runs/:id')
  @RequirePermissions(PermissionCode.ASSISTANT_READ)
  run(
    @CurrentEmployee() employee: EmployeePrincipal,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.service.getRun(id, employee.id);
  }

  @Get('capabilities')
  @RequirePermissions(PermissionCode.ASSISTANT_READ)
  capabilities() {
    return {
      chat: true,
      imageUploads: false,
      streaming: false,
      evidenceSources: ['service-health', 'incidents', 'prometheus-traffic'],
    };
  }
}
