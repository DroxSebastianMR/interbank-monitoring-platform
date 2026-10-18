import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { SWAGGER_AUTH_NAME } from '@/config/swagger/swagger.constants';
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';
import { JwtAccessGuard } from '@/modules/auth/guards/jwt-access.guard';
import type { AccessTokenPayload } from '@/modules/auth/types/auth.types';
import {
  ProfileResponseDto,
  StartPhoneChallengeDto,
  UpdateProfileDto,
  VerifyPhoneChallengeDto,
  CreateCustomerAddressDto,
  CustomerAddressResponseDto,
  CustomerDetailsResponseDto,
  UpdateCustomerDetailsDto,
} from '@/modules/profile/dto/profile.dto';
import { ProfileService } from '@/modules/profile/services/profile.service';

@ApiTags('profile')
@ApiBearerAuth(SWAGGER_AUTH_NAME)
@UseGuards(JwtAccessGuard)
@Controller('profile')
export class ProfileController {
  constructor(private readonly service: ProfileService) {}

  @Get()
  @ApiOperation({ summary: 'Consulta el perfil propio sin exponer datos sensibles' })
  @ApiOkResponse({ type: ProfileResponseDto })
  get(@CurrentUser() user: AccessTokenPayload) {
    return this.service.get(user.sub);
  }

  @Patch()
  @ApiOperation({
    summary: 'Actualiza nombre y preferencia comercial; no cambia identidad ni correo',
  })
  @ApiOkResponse({ type: ProfileResponseDto })
  update(@CurrentUser() user: AccessTokenPayload, @Body() dto: UpdateProfileDto) {
    return this.service.update(user.sub, dto);
  }

  @Get('details')
  @ApiOperation({ summary: 'Consulta datos opcionales del perfil propio' })
  @ApiOkResponse({ type: CustomerDetailsResponseDto })
  details(@CurrentUser() user: AccessTokenPayload) {
    return this.service.details(user.sub);
  }

  @Patch('details')
  @ApiOperation({ summary: 'Actualiza datos opcionales del perfil propio' })
  @ApiOkResponse({ type: CustomerDetailsResponseDto })
  updateDetails(@CurrentUser() user: AccessTokenPayload, @Body() dto: UpdateCustomerDetailsDto) {
    return this.service.updateDetails(user.sub, dto);
  }

  @Get('addresses')
  @ApiOperation({ summary: 'Lista direcciones del titular' })
  @ApiOkResponse({ type: [CustomerAddressResponseDto] })
  addresses(@CurrentUser() user: AccessTokenPayload) {
    return this.service.addresses(user.sub);
  }

  @Post('addresses')
  @ApiOperation({ summary: 'Añade una dirección al perfil' })
  @ApiOkResponse({ type: CustomerAddressResponseDto })
  addAddress(@CurrentUser() user: AccessTokenPayload, @Body() dto: CreateCustomerAddressDto) {
    return this.service.addAddress(user.sub, dto);
  }

  @Put('addresses/:id')
  @ApiOperation({ summary: 'Reemplaza una dirección propia' })
  @ApiOkResponse({ type: CustomerAddressResponseDto })
  updateAddress(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateCustomerAddressDto,
  ) {
    return this.service.updateAddress(user.sub, id, dto);
  }

  @Delete('addresses/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Elimina una dirección propia' })
  removeAddress(@CurrentUser() user: AccessTokenPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.removeAddress(user.sub, id);
  }

  @Post('phone/challenge')
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  @ApiOperation({
    summary: 'Inicia verificación de celular; código visible solo en entorno de desarrollo',
  })
  challenge(@CurrentUser() user: AccessTokenPayload, @Body() dto: StartPhoneChallengeDto) {
    return this.service.startPhoneChallenge(user.sub, dto.phoneNumber);
  }

  @Post('phone/verify')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Verifica celular con código de un solo uso' })
  @ApiOkResponse({ type: ProfileResponseDto })
  verify(@CurrentUser() user: AccessTokenPayload, @Body() dto: VerifyPhoneChallengeDto) {
    return this.service.verifyPhone(user.sub, dto.code);
  }
}
