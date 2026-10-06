import {
  Body,
  Controller,
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
  ApiCreatedResponse,
  ApiHeader,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

import { SWAGGER_AUTH_NAME } from '@/config/swagger/swagger.constants';
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';
import { JwtAccessGuard } from '@/modules/auth/guards/jwt-access.guard';
import type { AccessTokenPayload } from '@/modules/auth/types/auth.types';
import { CreateTransferDto } from '@/modules/transfers/dto/create-transfer.dto';
import { TransfersService } from '@/modules/transfers/services/transfers.service';
import { TransferQueryService } from '@/modules/transfers/services/transfer-query.service';
import { ResolveBeneficiaryDto } from '@/modules/transfers/dto/resolve-beneficiary.dto';
import {
  ListTransfersQueryDto,
  TransferSourceQueryDto,
} from '@/modules/transfers/dto/list-transfers-query.dto';
import {
  TransferResponseDto,
  TransferSourceResponseDto,
  TransferBeneficiaryResponseDto,
  TransferHistoryResponseDto,
} from '@/modules/transfers/dto/transfer-response.dto';

@ApiTags('transfers')
@Controller('transfers')
export class TransfersController {
  constructor(
    private readonly service: TransfersService,
    private readonly queries: TransferQueryService,
  ) {}
  @Get('health') health() {
    return this.service.health();
  }
  @Post()
  @UseGuards(JwtAccessGuard)
  @ApiBearerAuth(SWAGGER_AUTH_NAME)
  @ApiOperation({ summary: 'Transfiere entre cuentas propias o de terceros de la misma moneda' })
  @ApiHeader({
    name: 'Idempotency-Key',
    required: true,
    description: 'Clave única por intención de transferencia; conservarla al reintentar',
  })
  @ApiCreatedResponse({ type: TransferResponseDto })
  create(
    @CurrentUser() user: AccessTokenPayload,
    @Body() dto: CreateTransferDto,
    @Headers('idempotency-key') key?: string,
  ) {
    return this.service.create(user.sub, dto, key);
  }

  @Get('sources')
  @UseGuards(JwtAccessGuard)
  @ApiBearerAuth(SWAGGER_AUTH_NAME)
  @ApiOperation({ summary: 'Lista las cuentas propias habilitadas para seleccionar el origen' })
  @ApiOkResponse({ type: [TransferSourceResponseDto] })
  sources(@CurrentUser() user: AccessTokenPayload, @Query() query: TransferSourceQueryDto) {
    return this.queries.sources(user.sub, query);
  }

  @Post('beneficiaries/resolve')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAccessGuard)
  @ApiBearerAuth(SWAGGER_AUTH_NAME)
  @Throttle({ default: { limit: 12, ttl: 60000 } })
  @ApiOperation({
    summary: 'Localiza una cuenta destino por su número exacto en el banco simulado',
  })
  @ApiOkResponse({ type: TransferBeneficiaryResponseDto })
  resolve(@CurrentUser() user: AccessTokenPayload, @Body() dto: ResolveBeneficiaryDto) {
    return this.queries.resolve(user.sub, dto.accountNumber);
  }

  @Get()
  @UseGuards(JwtAccessGuard)
  @ApiBearerAuth(SWAGGER_AUTH_NAME)
  @ApiOperation({ summary: 'Lista transferencias enviadas y recibidas con filtros y cursor' })
  @ApiOkResponse({ type: TransferHistoryResponseDto })
  history(@CurrentUser() user: AccessTokenPayload, @Query() query: ListTransfersQueryDto) {
    return this.queries.history(user.sub, query);
  }

  @Get(':id')
  @UseGuards(JwtAccessGuard)
  @ApiBearerAuth(SWAGGER_AUTH_NAME)
  @ApiOperation({
    summary: 'Consulta la constancia de una transferencia en la que participa el usuario',
  })
  @ApiOkResponse({ type: TransferResponseDto })
  detail(@CurrentUser() user: AccessTokenPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.queries.detail(user.sub, id);
  }
}
