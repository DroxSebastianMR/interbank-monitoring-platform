export interface AccessTokenPayload {
  sub: string;
  email: string;
  sessionId: string;
}

export interface CachedAuthSession {
  user: AuthUserProfile;
  credentialProof: string;
  deviceId: string;
  deviceName?: string;
  createdAt: number;
  expiresAt: number;
}

export interface IssuedSession {
  id: string;
  token: string;
  expiresIn: number;
  value: CachedAuthSession;
}

export interface AuthUserProfile {
  id: string;
  documentNumber: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
}

export interface AuthenticatedUser extends AuthUserProfile {
  passwordHash: string;
}
