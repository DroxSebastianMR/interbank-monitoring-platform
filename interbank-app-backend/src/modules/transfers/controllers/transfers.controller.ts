import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { SWAGGER_AUTH_NAME } from '@/config/swagger/swagger.constants';
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';
import { JwtAccessGuard } from '@/modules/auth/guards/jwt-access.guard';
import type { AccessTokenPayload } from '@/modules/auth/types/auth.types';
import { CreateTransferDto } from '@/modules/transfers/dto/create-transfer.dto';
import { TransfersService } from '@/modules/transfers/services/transfers.service';

@ApiTags('transfers')
@Controller('transfers')
export class TransfersController {
  constructor(private readonly service: TransfersService) {}
  @Get('health') health() {
    return this.service.health();
  }
  @Post()
  @UseGuards(JwtAccessGuard)
  @ApiBearerAuth(SWAGGER_AUTH_NAME)
  @ApiOperation({ summary: 'Transfiere entre cuentas de la misma moneda' })
  create(@CurrentUser() user: AccessTokenPayload, @Body() dto: CreateTransferDto) {
    return this.service.create(user.sub, dto);
  }
}
