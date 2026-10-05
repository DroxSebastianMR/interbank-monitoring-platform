import type { FirstLoginDto } from '@/modules/auth/dto/first-login.dto';
import { AuthLoginMode } from '@/modules/auth/enums/auth-login-mode.enum';
import { LoginFailureReason } from '@/modules/auth/enums/login-failure-reason.enum';
import { AuthenticationException } from '@/modules/auth/exceptions/authentication.exception';
import { AuthRepository } from '@/modules/auth/repositories/auth.repository';
import { AuthSessionCacheService } from '@/modules/auth/services/auth-session-cache.service';
import { CredentialProofService } from '@/modules/auth/services/credential-proof.service';
import { LoginService } from '@/modules/auth/services/login.service';
import { PasswordService } from '@/modules/auth/services/password.service';
import { TokenService } from '@/modules/auth/services/token.service';
import type {
  AuthenticatedUser,
  CachedAuthSession,
  IssuedSession,
} from '@/modules/auth/types/auth.types';

describe('LoginService', () => {
  const user: AuthenticatedUser = {
    id: '00000000-0000-0000-0000-000000000010',
    documentNumber: '12345678',
    email: 'demo@interbank.test',
    passwordHash: 'stored-password-hash',
    firstName: 'Cliente',
    lastName: 'Demo',
  };
  const userProfile = {
    id: user.id,
    documentNumber: user.documentNumber,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
  };
  const session: IssuedSession = {
    id: 'hashed-session-id',
    token: 'new-session-token-with-more-than-32-characters',
    expiresIn: 2_592_000,
    value: {
      user: userProfile,
      credentialProof: 'credential-proof',
      deviceId: '550e8400-e29b-41d4-a716-446655440000',
      createdAt: Date.now(),
      expiresAt: Date.now() + 2_592_000_000,
    },
  };

  let repository: jest.Mocked<
    Pick<AuthRepository, 'findActiveByIdentity' | 'recordSuccessfulLogin'>
  >;
  let passwordService: jest.Mocked<Pick<PasswordService, 'compare'>>;
  let tokenService: jest.Mocked<Pick<TokenService, 'signAccessToken'>> & {
    accessTokenTtlSeconds: number;
  };
  let sessionCache: jest.Mocked<Pick<AuthSessionCacheService, 'create' | 'find' | 'rotate'>>;
  let credentialProof: jest.Mocked<Pick<CredentialProofService, 'create' | 'matches'>>;
  let service: LoginService;

  beforeEach(() => {
    repository = {
      findActiveByIdentity: jest.fn(),
      recordSuccessfulLogin: jest.fn(),
    };
    passwordService = { compare: jest.fn() };
    tokenService = {
      signAccessToken: jest.fn(),
      accessTokenTtlSeconds: 900,
    };
    sessionCache = {
      create: jest.fn(),
      find: jest.fn(),
      rotate: jest.fn(),
    };
    credentialProof = {
      create: jest.fn().mockReturnValue('credential-proof'),
      matches: jest.fn(),
    };
    service = new LoginService(
      repository as unknown as AuthRepository,
      passwordService as unknown as PasswordService,
      tokenService as unknown as TokenService,
      sessionCache as unknown as AuthSessionCacheService,
      credentialProof as unknown as CredentialProofService,
    );
  });

  it('authenticates the first login and masks personal identifiers', async () => {
    repository.findActiveByIdentity.mockResolvedValue(user);
    repository.recordSuccessfulLogin.mockResolvedValue();
    passwordService.compare.mockResolvedValue(true);
    sessionCache.create.mockResolvedValue(session);
    tokenService.signAccessToken.mockResolvedValue('signed-access-token');
    const input: FirstLoginDto = {
      documentNumber: '12345678',
      email: 'DEMO@INTERBANK.TEST',
      password: 'DemoSecure123!',
      deviceId: session.value.deviceId,
    };

    const result = await service.firstLogin(input);

    expect(repository.findActiveByIdentity).toHaveBeenCalledWith('12345678', 'demo@interbank.test');
    expect(result).toMatchObject({
      authenticated: true,
      loginMode: 'FIRST_LOGIN',
      user: { documentNumber: '****5678', email: 'd***@interbank.test' },
    });
    expect(result).not.toHaveProperty('password');
  });

  it('rotates a cached session during device login without querying PostgreSQL', async () => {
    const cachedSession: CachedAuthSession = session.value;
    sessionCache.find.mockResolvedValue(cachedSession);
    credentialProof.matches.mockReturnValue(true);
    sessionCache.rotate.mockResolvedValue(session);
    tokenService.signAccessToken.mockResolvedValue('signed-access-token');

    const result = await service.deviceLogin({
      sessionToken: 'previous-session-token-with-32-characters',
      deviceId: session.value.deviceId,
      password: 'DemoSecure123!',
    });

    expect(sessionCache.rotate).toHaveBeenCalled();
    expect(repository.findActiveByIdentity).not.toHaveBeenCalled();
    expect(passwordService.compare).not.toHaveBeenCalled();
    expect(result.loginMode).toBe(AuthLoginMode.DEVICE_LOGIN);
  });

  it('rejects a cached session used from a different device', async () => {
    sessionCache.find.mockResolvedValue(session.value);

    await expect(
      service.deviceLogin({
        sessionToken: 'previous-session-token-with-32-characters',
        deviceId: 'another-device-id-000000000000000000',
        password: 'DemoSecure123!',
      }),
    ).rejects.toMatchObject({ reason: LoginFailureReason.DEVICE_MISMATCH });

    expect(credentialProof.matches).not.toHaveBeenCalled();
  });

  it('returns the same unauthorized response when the user does not exist', async () => {
    repository.findActiveByIdentity.mockResolvedValue(null);
    passwordService.compare.mockResolvedValue(false);

    await expect(
      service.firstLogin({
        documentNumber: '12345678',
        email: 'unknown@interbank.test',
        password: 'InvalidPassword1!',
        deviceId: session.value.deviceId,
      }),
    ).rejects.toBeInstanceOf(AuthenticationException);
  });

  it('distinguishes the internal cause without exposing it in the HTTP response', async () => {
    sessionCache.find.mockResolvedValue(session.value);
    credentialProof.matches.mockReturnValue(false);

    const promise = service.deviceLogin({
      sessionToken: 'previous-session-token-with-32-characters',
      deviceId: session.value.deviceId,
      password: 'InvalidPassword1!',
    });

    await expect(promise).rejects.toMatchObject({
      reason: LoginFailureReason.SESSION_PASSWORD_MISMATCH,
    });
    await expect(promise).rejects.toMatchObject({
      response: {
        code: 'AUTH_INVALID_CREDENTIALS',
        message: 'Credenciales inválidas',
      },
    });
  });
});
