import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiNoContentResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { SWAGGER_AUTH_NAME } from '@/config/swagger/swagger.constants';
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';
import { JwtAccessGuard } from '@/modules/auth/guards/jwt-access.guard';
import type { AccessTokenPayload } from '@/modules/auth/types/auth.types';
import { CreateSavedServicePaymentDto } from '@/modules/service-payments/dto/create-saved-service-payment.dto';
import { CreateServicePaymentDto } from '@/modules/service-payments/dto/create-service-payment.dto';
import { InquireServiceDebtsDto } from '@/modules/service-payments/dto/inquire-service-debts.dto';
import { ListServicePaymentsQueryDto } from '@/modules/service-payments/dto/list-service-payments-query.dto';
import { ListServiceProvidersQueryDto } from '@/modules/service-payments/dto/list-service-providers-query.dto';
import { SavedServicePaymentService } from '@/modules/service-payments/services/saved-service-payment.service';
import { ServiceCatalogService } from '@/modules/service-payments/services/service-catalog.service';
import { ServiceDebtInquiryService } from '@/modules/service-payments/services/service-debt-inquiry.service';
import { ServicePaymentExecutionService } from '@/modules/service-payments/services/service-payment-execution.service';
import { ServicePaymentQueryService } from '@/modules/service-payments/services/service-payment-query.service';

@ApiTags('Service payments')
@ApiBearerAuth(SWAGGER_AUTH_NAME)
@UseGuards(JwtAccessGuard)
@Controller('service-payments')
export class ServicePaymentsController {
  constructor(
    private readonly catalogService: ServiceCatalogService,
    private readonly debtInquiryService: ServiceDebtInquiryService,
    private readonly paymentExecutionService: ServicePaymentExecutionService,
    private readonly paymentQueryService: ServicePaymentQueryService,
    private readonly savedPaymentService: SavedServicePaymentService,
  ) {}

  @Get('categories')
  @ApiOperation({ summary: 'Lista los rubros activos de pago de servicios' })
  categories() {
    return this.catalogService.categories();
  }

  @Get('providers')
  @ApiOperation({ summary: 'Busca empresas y convenios de recaudación' })
  providers(@Query() query: ListServiceProvidersQueryDto) {
    return this.catalogService.providers(query);
  }

  @Post('debts/inquiry')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Consulta los recibos pendientes asociados a un código' })
  inquire(@Body() dto: InquireServiceDebtsDto) {
    return this.debtInquiryService.inquire(dto);
  }

  @Get('history')
  @ApiOperation({ summary: 'Lista el historial de pagos del usuario autenticado' })
  history(@CurrentUser() user: AccessTokenPayload, @Query() query: ListServicePaymentsQueryDto) {
    return this.paymentQueryService.history(user.sub, query.limit);
  }

  @Get('saved')
  @ApiOperation({ summary: 'Lista los pagos frecuentes del usuario' })
  savedPayments(@CurrentUser() user: AccessTokenPayload) {
    return this.savedPaymentService.list(user.sub);
  }

  @Post('saved')
  @ApiOperation({ summary: 'Guarda o actualiza un pago frecuente' })
  savePayment(@CurrentUser() user: AccessTokenPayload, @Body() dto: CreateSavedServicePaymentDto) {
    return this.savedPaymentService.save(user.sub, dto);
  }

  @Delete('saved/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({ description: 'Pago frecuente eliminado' })
  @ApiOperation({ summary: 'Elimina un pago frecuente' })
  deleteSavedPayment(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.savedPaymentService.delete(user.sub, id);
  }

  @Post()
  @ApiHeader({
    name: 'Idempotency-Key',
    required: true,
    description: 'UUID o clave única generada por el cliente para evitar cobros duplicados',
  })
  @ApiOperation({ summary: 'Paga un recibo desde una cuenta propia y genera su movimiento' })
  create(
    @CurrentUser() user: AccessTokenPayload,
    @Body() dto: CreateServicePaymentDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    return this.paymentExecutionService.execute(user.sub, dto, idempotencyKey);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtiene la constancia de un pago de servicio' })
  detail(@CurrentUser() user: AccessTokenPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.paymentQueryService.detail(user.sub, id);
  }
}
