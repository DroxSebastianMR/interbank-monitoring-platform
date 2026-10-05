import type { AuthResponseDto } from '@/modules/auth/dto/auth-response.dto';
import type { AuthUserProfile, IssuedSession } from '@/modules/auth/types/auth.types';

export function mapAuthResponse(
  user: AuthUserProfile,
  accessToken: string,
  accessTokenExpiresIn: number,
  session: IssuedSession,
  loginMode: AuthResponseDto['loginMode'],
): AuthResponseDto {
  return {
    authenticated: true,
    loginMode,
    token: {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: accessTokenExpiresIn,
    },
    session: {
      sessionToken: session.token,
      expiresIn: session.expiresIn,
      deviceId: session.value.deviceId,
    },
    user: {
      id: user.id,
      documentNumber: maskDocumentNumber(user.documentNumber),
      email: maskEmail(user.email),
      ...(user.firstName ? { firstName: user.firstName } : {}),
      ...(user.lastName ? { lastName: user.lastName } : {}),
    },
  };
}

function maskDocumentNumber(documentNumber: string): string {
  return `${'*'.repeat(Math.max(0, documentNumber.length - 4))}${documentNumber.slice(-4)}`;
}

function maskEmail(email: string): string {
  const [localPart, domain] = email.split('@');
  if (!localPart || !domain) return '***';
  return `${localPart[0]}***@${domain}`;
}
