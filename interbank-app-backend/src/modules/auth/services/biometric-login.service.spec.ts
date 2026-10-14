import { BiometricLoginService } from '@/modules/auth/services/biometric-login.service';
import { AuthRepository } from '@/modules/auth/repositories/auth.repository';
import { BiometricCredentialRepository } from '@/modules/auth/repositories/biometric-credential.repository';
import { AuthSessionCacheService } from '@/modules/auth/services/auth-session-cache.service';
import { CredentialProofService } from '@/modules/auth/services/credential-proof.service';
import { LoginService } from '@/modules/auth/services/login.service';
import { AuthLoginMode } from '@/modules/auth/enums/auth-login-mode.enum';
import { AuthenticationException } from '@/modules/auth/exceptions/authentication.exception';

describe('BiometricLoginService', () => {
  const deviceId = '550e8400-e29b-41d4-a716-446655440000';
  const user = {
    id: '00000000-0000-0000-0000-000000000010',
    documentNumber: '12345678',
    email: 'demo@interbank.test',
    firstName: 'Cliente',
    lastName: 'Demo',
  };
  const cachedSession = {
    user,
    credentialProof: 'server-side-proof',
    deviceId,
    createdAt: Date.now(),
    expiresAt: Date.now() + 60_000,
  };
  let users: jest.Mocked<Pick<AuthRepository, 'findActiveById'>>;
  let credentials: jest.Mocked<
    Pick<BiometricCredentialRepository, 'save' | 'findActive' | 'markUsed' | 'revoke'>
  >;
  let sessions: jest.Mocked<Pick<AuthSessionCacheService, 'find' | 'create'>>;
  let proof: jest.Mocked<Pick<CredentialProofService, 'matches'>>;
  let loginService: jest.Mocked<Pick<LoginService, 'issueLogin'>>;
  let service: BiometricLoginService;

  beforeEach(() => {
    users = { findActiveById: jest.fn() };
    credentials = {
      save: jest.fn(),
      findActive: jest.fn(),
      markUsed: jest.fn(),
      revoke: jest.fn(),
    };
    sessions = { find: jest.fn(), create: jest.fn() };
    proof = { matches: jest.fn() };
    loginService = { issueLogin: jest.fn() };
    service = new BiometricLoginService(
      users as unknown as AuthRepository,
      credentials as unknown as BiometricCredentialRepository,
      sessions as unknown as AuthSessionCacheService,
      proof as unknown as CredentialProofService,
      loginService as unknown as LoginService,
    );
  });

  it('requires the existing session and password before binding a device', async () => {
    sessions.find.mockResolvedValue(cachedSession);
    proof.matches.mockReturnValue(false);

    await expect(
      service.enroll({
        sessionToken: 'a'.repeat(43),
        deviceId,
        password: 'WrongPassword!',
      }),
    ).rejects.toBeInstanceOf(AuthenticationException);
    expect(credentials.save).not.toHaveBeenCalled();
  });

  it('persists only a hash of the issued device credential', async () => {
    sessions.find.mockResolvedValue(cachedSession);
    proof.matches.mockReturnValue(true);
    users.findActiveById.mockResolvedValue({ ...user, passwordHash: 'hash' });
    credentials.save.mockResolvedValue({} as never);

    const result = await service.enroll({
      sessionToken: 'a'.repeat(43),
      deviceId,
      password: 'DemoSecure123!',
    });

    const saved = credentials.save.mock.calls[0]?.[0];
    expect(result.credential).toHaveLength(43);
    expect(saved?.tokenHash).toMatch(/^[a-f0-9]{64}$/);
    expect(saved?.tokenHash).not.toBe(result.credential);
    expect(saved).not.toHaveProperty('password');
  });

  it('issues a new server session only for an active, registered credential', async () => {
    credentials.findActive.mockResolvedValue({
      id: 'credential-id',
      userId: user.id,
      deviceId,
      credentialProof: cachedSession.credentialProof,
      user,
    });
    sessions.create.mockResolvedValue({} as never);
    credentials.markUsed.mockResolvedValue();
    loginService.issueLogin.mockResolvedValue({} as never);

    await service.login({ credential: 'b'.repeat(43), deviceId });

    expect(sessions.create).toHaveBeenCalledWith(user, cachedSession.credentialProof, deviceId);
    expect(loginService.issueLogin).toHaveBeenCalledWith(
      user,
      expect.anything(),
      AuthLoginMode.BIOMETRIC_LOGIN,
    );
  });

  it('rejects expired or revoked credentials without creating a session', async () => {
    credentials.findActive.mockResolvedValue(null);

    await expect(service.login({ credential: 'b'.repeat(43), deviceId })).rejects.toBeInstanceOf(
      AuthenticationException,
    );
    expect(sessions.create).not.toHaveBeenCalled();
  });
});
