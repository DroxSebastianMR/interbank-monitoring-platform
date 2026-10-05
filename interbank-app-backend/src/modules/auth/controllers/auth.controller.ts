import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { SkipThrottle, Throttle } from '@nestjs/throttler';

import { AUTH_LIMITS } from '@/modules/auth/constants/auth.constants';
import { AuthService } from '@/modules/auth/services/auth.service';
import { AuthResponseDto } from '@/modules/auth/dto/auth-response.dto';
import { DeviceLoginDto } from '@/modules/auth/dto/device-login.dto';
import { FirstLoginDto } from '@/modules/auth/dto/first-login.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly service: AuthService) {}

  @Get('health')
  @SkipThrottle()
  health() {
    return this.service.health();
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: AUTH_LIMITS.loginRequestsPerMinute, ttl: 60_000 } })
  @ApiOperation({ summary: 'Primer ingreso con DNI, correo, contraseña y dispositivo' })
  @ApiOkResponse({ type: AuthResponseDto, description: 'Autenticación exitosa' })
  @ApiUnauthorizedResponse({ description: 'Credenciales inválidas' })
  login(@Body() dto: FirstLoginDto): Promise<AuthResponseDto> {
    return this.service.login(dto);
  }

  @Post('device-login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: AUTH_LIMITS.loginRequestsPerMinute, ttl: 60_000 } })
  @ApiOperation({ summary: 'Autenticación posterior desde un dispositivo registrado' })
  @ApiOkResponse({ type: AuthResponseDto, description: 'Autenticación rápida exitosa' })
  @ApiUnauthorizedResponse({ description: 'Sesión o contraseña inválida' })
  deviceLogin(@Body() dto: DeviceLoginDto): Promise<AuthResponseDto> {
    return this.service.deviceLogin(dto);
  }
}
