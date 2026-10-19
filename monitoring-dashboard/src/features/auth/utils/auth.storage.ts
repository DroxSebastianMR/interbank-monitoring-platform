import type { AuthResponse } from '@/features/auth/types/auth.types';

const SESSION_KEY = 'interbank-monitor.auth.session';

export const authStorage = {
  getSession(): AuthResponse | null {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      const value: unknown = JSON.parse(raw);
      if (!value || typeof value !== 'object' || !('tokens' in value) || !('employee' in value)) return null;
      const session = value as AuthResponse;
      if (typeof session.tokens?.accessToken !== 'string' || typeof session.tokens?.refreshToken !== 'string') return null;
      return session;
    } catch {
      return null;
    }
  },
  set(session: AuthResponse): void {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  },
  clear(): void {
    sessionStorage.removeItem(SESSION_KEY);
  },
};
