import { useContext } from 'react';

import { AuthContext } from '@/app/providers/auth/auth-context';

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('AuthProvider no está disponible');
  return value;
}
