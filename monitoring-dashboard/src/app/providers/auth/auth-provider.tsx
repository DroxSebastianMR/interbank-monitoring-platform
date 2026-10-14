import { useEffect, useState, type ReactNode } from 'react';
import { AuthContext } from '@/app/providers/auth/auth-context';
import { authService } from '@/features/auth/services/auth.service';
import { authStorage } from '@/features/auth/utils/auth.storage';
import type { Employee } from '@/features/auth/types/auth.types';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [employee, setEmployee] = useState<Employee | null>(() => authStorage.getSession()?.employee ?? null);
  const [isLoading, setIsLoading] = useState(Boolean(authStorage.getSession()));
  useEffect(() => {
    if (!authStorage.getSession()) return;
    let active = true;
    void authService.me().then((profile) => {
      if (active) { setEmployee(profile); setIsLoading(false); }
    }).catch(() => {
      if (active) { authStorage.clear(); setEmployee(null); setIsLoading(false); }
    });
    return () => { active = false; };
  }, []);
  useEffect(() => {
    const expire = () => { setEmployee(null); setIsLoading(false); };
    window.addEventListener("monitoring-auth-expired", expire);
    return () => window.removeEventListener("monitoring-auth-expired", expire);
  }, []);
  return (
    <AuthContext.Provider
      value={{
        employee,
        isLoading,
        signIn: async (email, password) => {
          const session = await authService.login(email, password);
          setEmployee(session.employee);
        },
        signOut: async () => {
          try { await authService.logout(); } finally { setEmployee(null); }
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
