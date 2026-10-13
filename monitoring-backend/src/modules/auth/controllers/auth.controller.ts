import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';

import { AUTH_LIMITS } from '@/modules/auth/constants/auth.constants';
import { CurrentEmployee } from '@/modules/auth/decorators/current-employee.decorator';
import {
  AuthResponseDto,
  EmployeeProfileDto,
  LogoutResponseDto,
  SessionDto,
} from '@/modules/auth/dto/auth-response.dto';
import { ChangePasswordDto } from '@/modules/auth/dto/change-password.dto';
import { LoginDto } from '@/modules/auth/dto/login.dto';
import { RefreshSessionDto } from '@/modules/auth/dto/refresh-session.dto';
import { JwtAccessGuard } from '@/modules/auth/guards/jwt-access.guard';
import { AuthService } from '@/modules/auth/services/auth.service';
import type {
  EmployeePrincipal,
  HttpRequest,
  RequestMetadata,
} from '@/modules/auth/types/auth.types';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly service: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: AUTH_LIMITS.loginRequestsPerMinute, ttl: 60_000 } })
  @ApiOperation({ summary: 'Iniciar sesión como empleado del centro de monitoreo' })
  @ApiOkResponse({ type: AuthResponseDto })
  @ApiUnauthorizedResponse({ description: 'Credenciales inválidas' })
  login(@Body() input: LoginDto, @Req() request: HttpRequest): Promise<AuthResponseDto> {
    return this.service.login(input, this.metadataFrom(request));
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: AUTH_LIMITS.refreshRequestsPerMinute, ttl: 60_000 } })
  @ApiOperation({ summary: 'Rotar refresh token y emitir un nuevo access token' })
  @ApiOkResponse({ type: AuthResponseDto })
  refresh(@Body() input: RefreshSessionDto, @Req() request: HttpRequest): Promise<AuthResponseDto> {
    return this.service.refresh(input.refreshToken, this.metadataFrom(request));
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAccessGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Cerrar y revocar la sesión actual' })
  @ApiOkResponse({ type: LogoutResponseDto })
  logout(
    @CurrentEmployee() employee: EmployeePrincipal,
    @Req() request: HttpRequest,
  ): Promise<LogoutResponseDto> {
    return this.service.logout(employee, this.metadataFrom(request));
  }

  @Get('me')
  @UseGuards(JwtAccessGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Consultar el empleado, roles y permisos de la sesión' })
  @ApiOkResponse({ type: EmployeeProfileDto })
  me(@CurrentEmployee() employee: EmployeePrincipal): EmployeeProfileDto {
    return this.service.me(employee);
  }

  @Get('sessions')
  @UseGuards(JwtAccessGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Listar sesiones activas del empleado actual' })
  @ApiOkResponse({ type: SessionDto, isArray: true })
  sessions(@CurrentEmployee() employee: EmployeePrincipal): Promise<SessionDto[]> {
    return this.service.sessions(employee);
  }

  @Delete('sessions/:sessionId')
  @UseGuards(JwtAccessGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Revocar una sesión propia' })
  @ApiOkResponse({ type: LogoutResponseDto })
  revokeSession(
    @Param('sessionId', new ParseUUIDPipe()) sessionId: string,
    @CurrentEmployee() employee: EmployeePrincipal,
    @Req() request: HttpRequest,
  ): Promise<LogoutResponseDto> {
    return this.service.revokeSession(employee, sessionId, this.metadataFrom(request));
  }

  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAccessGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Revocar todas las sesiones del empleado actual' })
  @ApiOkResponse({ type: LogoutResponseDto })
  logoutAll(
    @CurrentEmployee() employee: EmployeePrincipal,
    @Req() request: HttpRequest,
  ): Promise<LogoutResponseDto> {
    return this.service.logoutAll(employee, this.metadataFrom(request));
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAccessGuard, ThrottlerGuard)
  @Throttle({ default: { limit: AUTH_LIMITS.loginRequestsPerMinute, ttl: 60_000 } })
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Cambiar contraseña y cerrar todas las sesiones' })
  @ApiOkResponse({ type: LogoutResponseDto })
  changePassword(
    @Body() input: ChangePasswordDto,
    @CurrentEmployee() employee: EmployeePrincipal,
    @Req() request: HttpRequest,
  ): Promise<LogoutResponseDto> {
    return this.service.changePassword(employee, input, this.metadataFrom(request));
  }

  private metadataFrom(request: HttpRequest): RequestMetadata {
    const userAgent = request.headers['user-agent'];
    return {
      ...(request.ip ? { ipAddress: request.ip } : {}),
      ...(typeof userAgent === 'string' ? { userAgent: userAgent.slice(0, 500) } : {}),
    };
  }
}
