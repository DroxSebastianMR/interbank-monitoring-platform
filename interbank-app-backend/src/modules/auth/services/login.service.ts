import { Injectable } from '@nestjs/common';

import { DUMMY_PASSWORD_HASH } from '@/modules/auth/constants/auth.constants';
import type { AuthResponseDto } from '@/modules/auth/dto/auth-response.dto';
import type { DeviceLoginDto } from '@/modules/auth/dto/device-login.dto';
import type { FirstLoginDto } from '@/modules/auth/dto/first-login.dto';
import { AuthLoginMode } from '@/modules/auth/enums/auth-login-mode.enum';
import { LoginFailureReason } from '@/modules/auth/enums/login-failure-reason.enum';
import { AuthenticationException } from '@/modules/auth/exceptions/authentication.exception';
import { mapAuthResponse } from '@/modules/auth/mappers/auth-response.mapper';
import { AuthRepository } from '@/modules/auth/repositories/auth.repository';
import { AuthSessionCacheService } from '@/modules/auth/services/auth-session-cache.service';
import { CredentialProofService } from '@/modules/auth/services/credential-proof.service';
import { PasswordService } from '@/modules/auth/services/password.service';
import { TokenService } from '@/modules/auth/services/token.service';
import type {
  AuthenticatedUser,
  AuthUserProfile,
  IssuedSession,
} from '@/modules/auth/types/auth.types';

@Injectable()
export class LoginService {
  constructor(
    private readonly repository: AuthRepository,
    private readonly passwordService: PasswordService,
    private readonly tokenService: TokenService,
    private readonly sessionCache: AuthSessionCacheService,
    private readonly credentialProof: CredentialProofService,
  ) {}

  async firstLogin(input: FirstLoginDto): Promise<AuthResponseDto> {
    const user = await this.repository.findActiveByIdentity(
      input.documentNumber.trim(),
      input.email.trim().toLowerCase(),
    );
    const authenticatedUser = await this.validatePassword(user, input.password);

    const session = await this.sessionCache.create(
      this.toProfile(authenticatedUser),
      this.credentialProof.create(authenticatedUser.id, input.deviceId, input.password),
      input.deviceId,
      input.deviceName,
    );
    await this.repository.recordSuccessfulLogin(authenticatedUser.id);
    return this.issueLogin(authenticatedUser, session, AuthLoginMode.FIRST_LOGIN);
  }

  async deviceLogin(input: DeviceLoginDto): Promise<AuthResponseDto> {
    const cachedSession = await this.sessionCache.find(input.sessionToken);
    if (!cachedSession) {
      throw new AuthenticationException(LoginFailureReason.SESSION_NOT_FOUND_OR_EXPIRED);
    }

    if (cachedSession.deviceId !== input.deviceId) {
      throw new AuthenticationException(LoginFailureReason.DEVICE_MISMATCH);
    }

    if (
      !this.credentialProof.matches(
        cachedSession.credentialProof,
        cachedSession.user.id,
        input.deviceId,
        input.password,
      )
    ) {
      throw new AuthenticationException(LoginFailureReason.SESSION_PASSWORD_MISMATCH);
    }

    const session = await this.sessionCache.rotate(input.sessionToken, cachedSession);
    return this.issueLogin(cachedSession.user, session, AuthLoginMode.DEVICE_LOGIN);
  }

  private async validatePassword(
    user: AuthenticatedUser | null,
    password: string,
  ): Promise<AuthenticatedUser> {
    const passwordIsValid = await this.passwordService.compare(
      password,
      user?.passwordHash ?? DUMMY_PASSWORD_HASH,
    );

    if (!user || !passwordIsValid) {
      throw new AuthenticationException(
        user ? LoginFailureReason.PASSWORD_MISMATCH : LoginFailureReason.USER_NOT_FOUND_OR_INACTIVE,
      );
    }

    return user;
  }

  async issueLogin(
    user: AuthUserProfile,
    session: IssuedSession,
    mode: AuthResponseDto['loginMode'],
  ): Promise<AuthResponseDto> {
    const accessToken = await this.tokenService.signAccessToken({
      sub: user.id,
      email: user.email,
      sessionId: session.id,
    });

    return mapAuthResponse(
      user,
      accessToken,
      this.tokenService.accessTokenTtlSeconds,
      session,
      mode,
    );
  }

  private toProfile(user: AuthenticatedUser): AuthUserProfile {
    return {
      id: user.id,
      documentNumber: user.documentNumber,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    };
  }
}
