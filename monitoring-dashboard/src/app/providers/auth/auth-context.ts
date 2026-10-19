import { createContext } from 'react';
import type { Employee } from '@/features/auth/types/auth.types';

export interface AuthContextValue {
  employee: Employee | null;
  isLoading: boolean;
  signIn(email: string, password: string): Promise<void>;
  signOut(): Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

