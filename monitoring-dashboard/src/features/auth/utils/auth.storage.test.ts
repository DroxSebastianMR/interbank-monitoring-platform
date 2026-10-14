import { beforeEach, describe, expect, it } from 'vitest';

import { authStorage } from '@/features/auth/utils/auth.storage';
import type { AuthResponse } from '@/features/auth/types/auth.types';

const session: AuthResponse = {
  authenticated: true,
  tokens: { accessToken: 'access-for-test', refreshToken: 'refresh-for-test' },
  employee: {
    id: 'employee-1', corporateEmail: 'operator@example.test', firstName: 'Ana',
    lastName: 'Ríos', roles: ['OPERATOR'], permissions: ['dashboard.read'],
  },
};

describe('authStorage', () => {
  beforeEach(() => sessionStorage.clear());

  it('restores the current tab session and clears it on logout', () => {
    authStorage.set(session);
    expect(authStorage.getSession()?.employee.id).toBe('employee-1');
    authStorage.clear();
    expect(authStorage.getSession()).toBeNull();
  });

  it('rejects malformed persisted values', () => {
    sessionStorage.setItem('interbank-monitor.auth.session', '{broken');
    expect(authStorage.getSession()).toBeNull();
  });
});
