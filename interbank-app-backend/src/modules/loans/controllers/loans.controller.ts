import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SWAGGER_AUTH_NAME } from '@/config/swagger/swagger.constants';
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';
import { JwtAccessGuard } from '@/modules/auth/guards/jwt-access.guard';
import type { AccessTokenPayload } from '@/modules/auth/types/auth.types';
import {
  ApplyLoanDto,
  LoanApplicationResponseDto,
  LoanQuoteDto,
} from '@/modules/loans/dto/loan.dto';
import { LoansService } from '@/modules/loans/services/loans.service';

@ApiTags('loans')
@ApiBearerAuth(SWAGGER_AUTH_NAME)
@UseGuards(JwtAccessGuard)
@Controller('loans')
export class LoansController {
  constructor(private readonly service: LoansService) {}

  @Get('offers')
  @ApiOperation({ summary: 'Catálogo ilustrativo, no oferta crediticia real' })
  offers() {
    return this.service.offers();
  }

  @Post('quote')
  @ApiOperation({ summary: 'Simula cuota y cronograma con TEA académica, sin TCEA real' })
  quote(@Body() dto: LoanQuoteDto) {
    return this.service.quote(dto);
  }

  @Post('applications')
  @ApiHeader({ name: 'Idempotency-Key', required: true })
  @ApiOperation({ summary: 'Registra solicitud para revisión; no aprueba ni desembolsa' })
  @ApiOkResponse({ type: LoanApplicationResponseDto })
  apply(
    @CurrentUser() user: AccessTokenPayload,
    @Body() dto: ApplyLoanDto,
    @Headers('idempotency-key') key?: string,
  ) {
    return this.service.apply(user.sub, dto, key);
  }

  @Get('applications')
  @ApiOperation({ summary: 'Lista mis solicitudes de préstamo' })
  @ApiOkResponse({ type: [LoanApplicationResponseDto] })
  list(@CurrentUser() user: AccessTokenPayload) {
    return this.service.list(user.sub);
  }

  @Get('applications/:id')
  @ApiOperation({ summary: 'Consulta una solicitud propia' })
  @ApiOkResponse({ type: LoanApplicationResponseDto })
  detail(@CurrentUser() user: AccessTokenPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.detail(user.sub, id);
  }

  @Get('applications/:id/schedule')
  @ApiOperation({ summary: 'Cronograma referencial de una solicitud propia' })
  schedule(@CurrentUser() user: AccessTokenPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.schedule(user.sub, id);
  }

  @Post('applications/:id/cancel')
  @ApiOperation({ summary: 'Cancela una solicitud aún pendiente' })
  @ApiOkResponse({ type: LoanApplicationResponseDto })
  cancel(@CurrentUser() user: AccessTokenPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.cancel(user.sub, id);
  }
}
