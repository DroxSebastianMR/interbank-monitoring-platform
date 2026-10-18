import {
  Controller,
  Delete,
  Get,
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
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { SWAGGER_AUTH_NAME } from '@/config/swagger/swagger.constants';
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';
import { JwtAccessGuard } from '@/modules/auth/guards/jwt-access.guard';
import type { AccessTokenPayload } from '@/modules/auth/types/auth.types';
import {
  ListPromotionsQueryDto,
  PromotionResponseDto,
  PromotionVoucherResponseDto,
} from '@/modules/promotions/dto/promotion.dto';
import { PromotionsService } from '@/modules/promotions/services/promotions.service';

@ApiTags('promotions')
@ApiBearerAuth(SWAGGER_AUTH_NAME)
@UseGuards(JwtAccessGuard)
@Controller('promotions')
export class PromotionsController {
  constructor(private readonly service: PromotionsService) {}

  @Get('categories')
  @ApiOperation({ summary: 'Lista categorías del catálogo promocional' })
  categories() {
    return this.service.categories();
  }

  @Get('saved')
  @ApiOperation({ summary: 'Lista promociones guardadas y vigentes' })
  @ApiOkResponse({ type: [PromotionResponseDto] })
  saved(@CurrentUser() user: AccessTokenPayload) {
    return this.service.list(user.sub, undefined, true);
  }

  @Get('vouchers')
  @ApiOperation({ summary: 'Lista códigos promocionales emitidos al usuario' })
  @ApiOkResponse({ type: [PromotionVoucherResponseDto] })
  vouchers(@CurrentUser() user: AccessTokenPayload) {
    return this.service.vouchers(user.sub);
  }

  @Get('vouchers/:id')
  @ApiOperation({ summary: 'Consulta un código propio y su vencimiento' })
  @ApiOkResponse({ type: PromotionVoucherResponseDto })
  voucher(@CurrentUser() user: AccessTokenPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.voucher(user.sub, id);
  }

  @Get()
  @ApiOperation({ summary: 'Lista promociones vigentes, con filtro opcional por categoría' })
  @ApiOkResponse({ type: [PromotionResponseDto] })
  list(@CurrentUser() user: AccessTokenPayload, @Query() query: ListPromotionsQueryDto) {
    return this.service.list(user.sub, query.category);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consulta condiciones y vigencia de una promoción' })
  @ApiOkResponse({ type: PromotionResponseDto })
  detail(@CurrentUser() user: AccessTokenPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.detail(user.sub, id);
  }

  @Post(':id/vouchers')
  @ApiOperation({
    summary:
      'Emite un código de demostración propio, una vez por promoción; no canjeable en comercios reales',
  })
  @ApiOkResponse({ type: PromotionVoucherResponseDto })
  claim(@CurrentUser() user: AccessTokenPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.claim(user.sub, id);
  }

  @Post(':id/save')
  @ApiOperation({ summary: 'Guarda una promoción vigente como favorita' })
  @ApiOkResponse({ type: PromotionResponseDto })
  save(@CurrentUser() user: AccessTokenPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.save(user.sub, id);
  }

  @Delete(':id/save')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  @ApiOperation({ summary: 'Elimina una promoción de favoritos' })
  remove(@CurrentUser() user: AccessTokenPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(user.sub, id);
  }
}
