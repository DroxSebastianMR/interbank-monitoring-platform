import { describe, expect, it } from 'vitest';
import { loginSchema } from '@/features/auth/schemas/login.schema';

describe('loginSchema', () => {
  it('accepts a valid employee email and non-empty password', () => {
    expect(loginSchema.safeParse({ corporateEmail: 'ana@example.test', password: 'secret' }).success).toBe(true);
  });

  it('rejects invalid email or missing password before calling the API', () => {
    expect(loginSchema.safeParse({ corporateEmail: 'ana', password: 'secret' }).success).toBe(false);
    expect(loginSchema.safeParse({ corporateEmail: 'ana@example.test', password: '' }).success).toBe(false);
  });
});
