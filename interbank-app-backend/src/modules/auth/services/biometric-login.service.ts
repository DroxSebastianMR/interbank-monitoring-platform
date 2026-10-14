import { Injectable } from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';

import { BIOMETRIC_CREDENTIAL_TTL_SECONDS } from '@/modules/auth/constants/auth.constants';
import type {
  BiometricCredentialDto,
  BiometricEnrollmentDto,
  BiometricLoginDto,
} from '@/modules/auth/dto/biometric-credential.dto';
import type { AuthResponseDto } from '@/modules/auth/dto/auth-response.dto';
import { AuthLoginMode } from '@/modules/auth/enums/auth-login-mode.enum';
import { LoginFailureReason } from '@/modules/auth/enums/login-failure-reason.enum';
import { AuthenticationException } from '@/modules/auth/exceptions/authentication.exception';
import { AuthRepository } from '@/modules/auth/repositories/auth.repository';
import { BiometricCredentialRepository } from '@/modules/auth/repositories/biometric-credential.repository';
import { AuthSessionCacheService } from '@/modules/auth/services/auth-session-cache.service';
import { CredentialProofService } from '@/modules/auth/services/credential-proof.service';
import { LoginService } from '@/modules/auth/services/login.service';

@Injectable()
export class BiometricLoginService {
  constructor(
    private readonly users: AuthRepository,
    private readonly credentials: BiometricCredentialRepository,
    private readonly sessions: AuthSessionCacheService,
    private readonly credentialProof: CredentialProofService,
    private readonly loginService: LoginService,
  ) {}

  async enroll(input: BiometricEnrollmentDto): Promise<BiometricCredentialDto> {
    const session = await this.sessions.find(input.sessionToken);
    if (!session || session.deviceId !== input.deviceId) {
      throw new AuthenticationException(LoginFailureReason.SESSION_NOT_FOUND_OR_EXPIRED);
    }
    if (
      !this.credentialProof.matches(
        session.credentialProof,
        session.user.id,
        input.deviceId,
        input.password,
      )
    ) {
      throw new AuthenticationException(LoginFailureReason.PASSWORD_MISMATCH);
    }
    if (!(await this.users.findActiveById(session.user.id))) {
      throw new AuthenticationException(LoginFailureReason.USER_NOT_FOUND_OR_INACTIVE);
    }

    const credential = randomBytes(32).toString('base64url');
    await this.credentials.save({
      userId: session.user.id,
      deviceId: input.deviceId,
      tokenHash: this.hash(credential),
      credentialProof: session.credentialProof,
      expiresAt: new Date(Date.now() + BIOMETRIC_CREDENTIAL_TTL_SECONDS * 1000),
    });
    return { credential, expiresIn: BIOMETRIC_CREDENTIAL_TTL_SECONDS };
  }

  async login(input: BiometricLoginDto): Promise<AuthResponseDto> {
    const record = await this.credentials.findActive(this.hash(input.credential), input.deviceId);
    if (!record) {
      throw new AuthenticationException(LoginFailureReason.BIOMETRIC_CREDENTIAL_INVALID);
    }
    const user = record.user;
    const session = await this.sessions.create(user, record.credentialProof, input.deviceId);
    await this.credentials.markUsed(record.id);
    return this.loginService.issueLogin(user, session, AuthLoginMode.BIOMETRIC_LOGIN);
  }

  async revoke(input: BiometricLoginDto): Promise<void> {
    await this.credentials.revoke(this.hash(input.credential), input.deviceId);
  }

  private hash(credential: string): string {
    return createHash('sha256').update(credential).digest('hex');
  }
}
