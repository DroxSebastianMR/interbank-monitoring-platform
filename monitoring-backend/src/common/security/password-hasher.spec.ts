import { hashPassword, verifyPassword } from '@/common/security/password-hasher';

describe('password hasher', () => {
  it('hashes with a random salt and verifies only the original password', async () => {
    const first = await hashPassword('UnaClaveCorporativaSegura!');
    const second = await hashPassword('UnaClaveCorporativaSegura!');

    expect(first).not.toBe(second);
    await expect(verifyPassword('UnaClaveCorporativaSegura!', first)).resolves.toBe(true);
    await expect(verifyPassword('ClaveIncorrecta!', first)).resolves.toBe(false);
  });

  it('rejects malformed hashes safely', async () => {
    await expect(verifyPassword('cualquier-valor', 'hash-invalido')).resolves.toBe(false);
  });
});
