import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { SWAGGER_AUTH_NAME } from '@/config/swagger/swagger.constants';
import { ListTransactionsQueryDto } from '@/modules/accounts/dto/list-transactions-query.dto';
import { AccountsService } from '@/modules/accounts/services/accounts.service';
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';
import { JwtAccessGuard } from '@/modules/auth/guards/jwt-access.guard';
import type { AccessTokenPayload } from '@/modules/auth/types/auth.types';

@ApiTags('accounts')
@Controller('accounts')
export class AccountsController {
  constructor(private readonly service: AccountsService) {}
  @Get('health') health() {
    return this.service.health();
  }

  @Get()
  @UseGuards(JwtAccessGuard)
  @ApiBearerAuth(SWAGGER_AUTH_NAME)
  @ApiOperation({ summary: 'Lista las cuentas del usuario autenticado' })
  list(@CurrentUser() user: AccessTokenPayload) {
    return this.service.list(user.sub);
  }

  @Get(':id/balance')
  @UseGuards(JwtAccessGuard)
  @ApiBearerAuth(SWAGGER_AUTH_NAME)
  @ApiOperation({ summary: 'Consulta el saldo de una cuenta propia' })
  balance(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.service.balance(user.sub, id);
  }

  @Get(':id/transactions')
  @UseGuards(JwtAccessGuard)
  @ApiBearerAuth(SWAGGER_AUTH_NAME)
  @ApiOperation({ summary: 'Lista los movimientos recientes de una cuenta propia' })
  transactions(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id') id: string,
    @Query() query: ListTransactionsQueryDto,
  ) {
    return this.service.transactions(user.sub, id, query.limit);
  }
}
