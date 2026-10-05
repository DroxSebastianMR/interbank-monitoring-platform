import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { SWAGGER_AUTH_NAME } from '@/config/swagger/swagger.constants';
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';
import { JwtAccessGuard } from '@/modules/auth/guards/jwt-access.guard';
import type { AccessTokenPayload } from '@/modules/auth/types/auth.types';
import { HomeResponseDto } from '@/modules/home/dto/home-response.dto';
import { HomeService } from '@/modules/home/services/home.service';

@ApiTags('Home')
@ApiBearerAuth(SWAGGER_AUTH_NAME)
@UseGuards(JwtAccessGuard)
@Controller('home')
export class HomeController {
  constructor(private readonly service: HomeService) {}

  @Get()
  @ApiOperation({ summary: 'Carga el menú principal del usuario autenticado' })
  @ApiOkResponse({ type: HomeResponseDto })
  getHome(@CurrentUser() user: AccessTokenPayload): Promise<HomeResponseDto> {
    return this.service.getHome(user.sub);
  }
}
