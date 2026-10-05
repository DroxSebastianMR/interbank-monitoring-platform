import { Controller, Get, Param, ParseUUIDPipe, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { SWAGGER_AUTH_NAME } from '@/config/swagger/swagger.constants';
import { ListTransactionsQueryDto } from '@/modules/accounts/dto/list-transactions-query.dto';
import { ListAccountsQueryDto } from '@/modules/accounts/dto/list-accounts-query.dto';
import { ListCardsQueryDto } from '@/modules/accounts/dto/list-cards-query.dto';
import {
  AccountBalanceResponseDto,
  AccountIdentifiersResponseDto,
  AccountResponseDto,
  AccountStatementResponseDto,
  AccountTransactionResponseDto,
  AccountTypeResponseDto,
  CardResponseDto,
  CardTypeResponseDto,
} from '@/modules/accounts/dto/account-response.dto';
import { AccountCardsService } from '@/modules/accounts/services/account-cards.service';
import { AccountCatalogService } from '@/modules/accounts/services/account-catalog.service';
import { AccountTransactionsService } from '@/modules/accounts/services/account-transactions.service';
import { AccountsService } from '@/modules/accounts/services/accounts.service';
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';
import { JwtAccessGuard } from '@/modules/auth/guards/jwt-access.guard';
import type { AccessTokenPayload } from '@/modules/auth/types/auth.types';

@ApiTags('accounts')
@Controller('accounts')
export class AccountsController {
  constructor(
    private readonly service: AccountsService,
    private readonly catalog: AccountCatalogService,
    private readonly cards: AccountCardsService,
    private readonly movements: AccountTransactionsService,
  ) {}
  @Get('health') health() {
    return this.service.health();
  }

  @Get()
  @UseGuards(JwtAccessGuard)
  @ApiBearerAuth(SWAGGER_AUTH_NAME)
  @ApiOperation({ summary: 'Lista las cuentas del usuario autenticado' })
  @ApiOkResponse({ type: [AccountResponseDto] })
  list(@CurrentUser() user: AccessTokenPayload, @Query() query: ListAccountsQueryDto) {
    return this.service.list(user.sub, query);
  }

  @Get('types')
  @UseGuards(JwtAccessGuard)
  @ApiBearerAuth(SWAGGER_AUTH_NAME)
  @ApiOperation({ summary: 'Lista el catálogo activo de tipos de cuenta' })
  @ApiOkResponse({ type: [AccountTypeResponseDto] })
  accountTypes() {
    return this.catalog.accountTypes();
  }

  @Get('card-types')
  @UseGuards(JwtAccessGuard)
  @ApiBearerAuth(SWAGGER_AUTH_NAME)
  @ApiOperation({ summary: 'Lista el catálogo activo de tipos de tarjeta' })
  @ApiOkResponse({ type: [CardTypeResponseDto] })
  cardTypes() {
    return this.catalog.cardTypes();
  }

  @Get('cards')
  @UseGuards(JwtAccessGuard)
  @ApiBearerAuth(SWAGGER_AUTH_NAME)
  @ApiOperation({ summary: 'Lista las tarjetas de débito y crédito del usuario' })
  @ApiOkResponse({ type: [CardResponseDto] })
  listCards(@CurrentUser() user: AccessTokenPayload, @Query() query: ListCardsQueryDto) {
    return this.cards.list(user.sub, query);
  }

  @Get('cards/:cardId')
  @UseGuards(JwtAccessGuard)
  @ApiBearerAuth(SWAGGER_AUTH_NAME)
  @ApiOperation({ summary: 'Consulta una tarjeta propia y sus saldos de crédito por moneda' })
  @ApiOkResponse({ type: CardResponseDto })
  cardDetail(
    @CurrentUser() user: AccessTokenPayload,
    @Param('cardId', ParseUUIDPipe) cardId: string,
  ) {
    return this.cards.detail(user.sub, cardId);
  }

  @Get(':id')
  @UseGuards(JwtAccessGuard)
  @ApiBearerAuth(SWAGGER_AUTH_NAME)
  @ApiOperation({ summary: 'Consulta el detalle de una cuenta propia' })
  @ApiOkResponse({ type: AccountResponseDto })
  detail(@CurrentUser() user: AccessTokenPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.detail(user.sub, id);
  }

  @Get(':id/identifiers')
  @UseGuards(JwtAccessGuard)
  @ApiBearerAuth(SWAGGER_AUTH_NAME)
  @ApiOperation({ summary: 'Consulta el número completo y CCI simulado de una cuenta propia' })
  @ApiOkResponse({ type: AccountIdentifiersResponseDto })
  identifiers(@CurrentUser() user: AccessTokenPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.identifiers(user.sub, id);
  }

  @Get(':id/cards')
  @UseGuards(JwtAccessGuard)
  @ApiBearerAuth(SWAGGER_AUTH_NAME)
  @ApiOperation({ summary: 'Lista las tarjetas de débito vinculadas a una cuenta propia' })
  @ApiOkResponse({ type: [CardResponseDto] })
  accountCards(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: ListCardsQueryDto,
  ) {
    return this.cards.list(user.sub, query, id);
  }

  @Get(':id/balance')
  @UseGuards(JwtAccessGuard)
  @ApiBearerAuth(SWAGGER_AUTH_NAME)
  @ApiOperation({ summary: 'Consulta el saldo de una cuenta propia' })
  @ApiOkResponse({ type: AccountBalanceResponseDto })
  balance(@CurrentUser() user: AccessTokenPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.balance(user.sub, id);
  }

  @Get(':id/transactions')
  @UseGuards(JwtAccessGuard)
  @ApiBearerAuth(SWAGGER_AUTH_NAME)
  @ApiOperation({ summary: 'Lista los movimientos recientes de una cuenta propia' })
  @ApiOkResponse({ type: [AccountTransactionResponseDto] })
  transactions(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: ListTransactionsQueryDto,
  ) {
    return this.movements.list(user.sub, id, query);
  }

  @Get(':id/statement')
  @UseGuards(JwtAccessGuard)
  @ApiBearerAuth(SWAGGER_AUTH_NAME)
  @ApiOperation({ summary: 'Consulta movimientos por cursor, fechas y tipo de operación' })
  @ApiOkResponse({ type: AccountStatementResponseDto })
  statement(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: ListTransactionsQueryDto,
  ) {
    return this.movements.page(user.sub, id, query);
  }
}
