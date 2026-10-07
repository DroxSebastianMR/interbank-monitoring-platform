import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmployeeStatus } from '@prisma/client';
import { randomUUID } from 'node:crypto';

import type { AuthConfig } from '@/config/auth.config';
import { DUMMY_PASSWORD_HASH } from '@/modules/auth/constants/auth.constants';
import type { AuthResponseDto, LogoutResponseDto } from '@/modules/auth/dto/auth-response.dto';
import type { LoginDto } from '@/modules/auth/dto/login.dto';
import {
  AccountLockedException,
  InvalidCredentialsException,
  InvalidSessionException,
} from '@/modules/auth/exceptions/authentication.exception';
import { AuthRepository } from '@/modules/auth/repositories/auth.repository';
import type {
  EmployeeAccessProfile,
  EmployeePrincipal,
  RequestMetadata,
} from '@/modules/auth/types/auth.types';
import { PasswordService } from '@/modules/auth/services/password.service';
import { TokenService } from '@/modules/auth/services/token.service';

@Injectable()
export class AuthService {
  private readonly config: AuthConfig;

  constructor(
    private readonly repository: AuthRepository,
    private readonly passwordService: PasswordService,
    private readonly tokenService: TokenService,
    configService: ConfigService,
  ) {
    this.config = configService.getOrThrow<AuthConfig>('auth');
  }

  async login(input: LoginDto, metadata: RequestMetadata): Promise<AuthResponseDto> {
    const email = input.corporateEmail.trim().toLowerCase();
    const employee = await this.repository.findByCorporateEmail(email);
    const passwordMatches = await this.passwordService.compare(
      input.password,
      employee?.passwordHash ?? DUMMY_PASSWORD_HASH,
    );

    if (!employee || !passwordMatches || employee.status !== EmployeeStatus.ACTIVE) {
      if (employee?.status === EmployeeStatus.ACTIVE) {
        await this.recordFailedLogin(employee.id, metadata);
      }
      throw new InvalidCredentialsException();
    }

    if (employee.lockedUntil && employee.lockedUntil.getTime() > Date.now()) {
      const retryAfterSeconds = Math.ceil((employee.lockedUntil.getTime() - Date.now()) / 1000);
      throw new AccountLockedException(retryAfterSeconds);
    }

    const profile = this.repository.toAccessProfile(employee);
    return this.issueNewSession(profile, metadata);
  }

  async refresh(refreshToken: string, metadata: RequestMetadata): Promise<AuthResponseDto> {
    const currentHash = this.tokenService.hashRefreshToken(refreshToken);
    const current = await this.repository.findByRefreshTokenHash(currentHash);
    if (!current) throw new InvalidSessionException();

    const nextRefreshToken = this.tokenService.createRefreshToken();
    const nextHash = this.tokenService.hashRefreshToken(nextRefreshToken);
    const expiresAt = this.refreshTokenExpiresAt();
    const rotated = await this.repository.rotateSession(
      current.sessionId,
      currentHash,
      nextHash,
      expiresAt,
      metadata,
    );
    if (!rotated) throw new InvalidSessionException();

    return this.buildResponse(current.employee, current.sessionId, nextRefreshToken);
  }

  async logout(
    principal: EmployeePrincipal,
    metadata: RequestMetadata,
  ): Promise<LogoutResponseDto> {
    await this.repository.revokeSession(principal.sessionId, principal.id, metadata);
    return { loggedOut: true };
  }

  me(principal: EmployeePrincipal): EmployeeAccessProfile {
    return {
      id: principal.id,
      employeeCode: principal.employeeCode,
      corporateEmail: principal.corporateEmail,
      firstName: principal.firstName,
      lastName: principal.lastName,
      jobTitle: principal.jobTitle,
      department: principal.department,
      roles: principal.roles,
      permissions: principal.permissions,
    };
  }

  private async issueNewSession(
    employee: EmployeeAccessProfile,
    metadata: RequestMetadata,
  ): Promise<AuthResponseDto> {
    const sessionId = randomUUID();
    const refreshToken = this.tokenService.createRefreshToken();
    await this.repository.createSession(
      sessionId,
      employee.id,
      this.tokenService.hashRefreshToken(refreshToken),
      this.refreshTokenExpiresAt(),
      metadata,
    );
    return this.buildResponse(employee, sessionId, refreshToken);
  }

  private async buildResponse(
    employee: EmployeeAccessProfile,
    sessionId: string,
    refreshToken: string,
  ): Promise<AuthResponseDto> {
    const accessToken = await this.tokenService.signAccessToken({
      sub: employee.id,
      email: employee.corporateEmail,
      sessionId,
      type: 'access',
    });

    return {
      authenticated: true,
      tokens: {
        accessToken,
        refreshToken,
        tokenType: 'Bearer',
        accessTokenExpiresIn: this.tokenService.accessTokenTtlSeconds,
        refreshTokenExpiresIn: this.tokenService.refreshTokenTtlSeconds,
      },
      employee,
    };
  }

  private async recordFailedLogin(employeeId: string, metadata: RequestMetadata): Promise<void> {
    await this.repository.recordFailedLogin(
      employeeId,
      this.config.maxFailedAttempts,
      this.config.lockMinutes,
      metadata,
    );
  }

  private refreshTokenExpiresAt(): Date {
    return new Date(Date.now() + this.tokenService.refreshTokenTtlSeconds * 1000);
  }
}
