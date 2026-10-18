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
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { SWAGGER_AUTH_NAME } from '@/config/swagger/swagger.constants';
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';
import { JwtAccessGuard } from '@/modules/auth/guards/jwt-access.guard';
import type { AccessTokenPayload } from '@/modules/auth/types/auth.types';
import {
  EnrollPlinDto,
  PlinEnrollmentResponseDto,
  PlinPaymentResponseDto,
  PlinRecipientResponseDto,
  ResolvePlinRecipientDto,
  SendPlinDto,
  SavePlinFavoriteDto,
  PlinFavoriteResponseDto,
  PlinRecentResponseDto,
} from '@/modules/plin/dto/plin.dto';
import { PlinService } from '@/modules/plin/services/plin.service';

@ApiTags('plin')
@ApiBearerAuth(SWAGGER_AUTH_NAME)
@UseGuards(JwtAccessGuard)
@Controller('plin')
export class PlinController {
  constructor(private readonly service: PlinService) {}

  @Get('enrollment')
  @ApiOperation({ summary: 'Consulta afiliación propia a Plin' })
  @ApiOkResponse({ type: PlinEnrollmentResponseDto })
  enrollment(@CurrentUser() user: AccessTokenPayload) {
    return this.service.enrollment(user.sub);
  }

  @Post('enrollment')
  @ApiOperation({
    summary: 'Afiliar celular verificado y cuenta propia en soles',
  })
  @ApiOkResponse({ type: PlinEnrollmentResponseDto })
  enroll(@CurrentUser() user: AccessTokenPayload, @Body() dto: EnrollPlinDto) {
    return this.service.enroll(user.sub, dto.accountId);
  }

  @Delete('enrollment')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Desactiva afiliación a Plin' })
  disable(@CurrentUser() user: AccessTokenPayload) {
    return this.service.disable(user.sub);
  }

  @Get('sources')
  @ApiOperation({ summary: 'Cuentas propias en soles aptas para afiliación' })
  sources(@CurrentUser() user: AccessTokenPayload) {
    return this.service.sources(user.sub);
  }

  @Get('networks')
  @ApiOperation({ summary: 'Redes destino y disponibilidad del conector interoperable' })
  networks() {
    return this.service.networks();
  }

  @Get('favorites')
  @ApiOperation({ summary: 'Lista contactos favoritos propios' })
  @ApiOkResponse({ type: [PlinFavoriteResponseDto] })
  favorites(@CurrentUser() user: AccessTokenPayload) {
    return this.service.favorites(user.sub);
  }

  @Post('favorites')
  @ApiOperation({
    summary: 'Guarda o actualiza un contacto favorito; la red es preferencia, no verificación',
  })
  @ApiOkResponse({ type: PlinFavoriteResponseDto })
  saveFavorite(@CurrentUser() user: AccessTokenPayload, @Body() dto: SavePlinFavoriteDto) {
    return this.service.saveFavorite(user.sub, dto);
  }

  @Delete('favorites/:phoneNumber')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  @ApiOperation({ summary: 'Elimina un contacto favorito propio' })
  removeFavorite(
    @CurrentUser() user: AccessTokenPayload,
    @Param('phoneNumber') phoneNumber: string,
  ) {
    return this.service.removeFavorite(user.sub, phoneNumber);
  }

  @Get('recents')
  @ApiOperation({ summary: 'Contactos recientes derivados de movimientos propios confirmados' })
  @ApiOkResponse({ type: [PlinRecentResponseDto] })
  recent(@CurrentUser() user: AccessTokenPayload) {
    return this.service.recent(user.sub);
  }

  @Post('recipients/resolve')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({
    summary:
      'Resuelve destinatario interno; Yape requiere conector de red y no se verifica por número local',
  })
  @ApiOkResponse({ type: PlinRecipientResponseDto })
  resolve(@CurrentUser() user: AccessTokenPayload, @Body() dto: ResolvePlinRecipientDto) {
    return this.service.resolve(user.sub, dto.phoneNumber, dto.network);
  }

  @Post('payments')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiHeader({ name: 'Idempotency-Key', required: true })
  @ApiOperation({
    summary: 'Transfiere entre cuentas internas afiliadas, con límites e idempotencia',
  })
  @ApiOkResponse({ type: PlinPaymentResponseDto })
  send(
    @CurrentUser() user: AccessTokenPayload,
    @Body() dto: SendPlinDto,
    @Headers('idempotency-key') key?: string,
  ) {
    return this.service.send(user.sub, dto, key);
  }

  @Get('payments')
  @ApiOperation({ summary: 'Lista los últimos 50 plineos enviados o recibidos' })
  @ApiOkResponse({ type: [PlinPaymentResponseDto] })
  list(@CurrentUser() user: AccessTokenPayload) {
    return this.service.list(user.sub);
  }

  @Get('payments/:id')
  @ApiOperation({ summary: 'Consulta constancia de un plineo propio' })
  @ApiOkResponse({ type: PlinPaymentResponseDto })
  detail(@CurrentUser() user: AccessTokenPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.detail(user.sub, id);
  }
}
