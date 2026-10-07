import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  loginRegisteredDevice,
  loginUser,
} from "@/src/domain/auth/auth.usecase";
import { authStorage } from "@/src/modules/auth/storage/auth.storage";
import type {
  AuthStatus,
  AuthEntryMode,
  AuthUser,
  DeviceLoginCredentials,
  LoginCredentials,
} from "@/src/modules/auth/types/auth.types";

interface AuthContextValue {
  status: AuthStatus;
  entryMode: AuthEntryMode;
  user: AuthUser | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  deviceLogin: (credentials: DeviceLoginCredentials) => Promise<void>;
  useAnotherAccount: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("checking");
  const [entryMode, setEntryMode] =
    useState<AuthEntryMode>("first-login");
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    let active = true;

    const hydrate = async (): Promise<void> => {
      const [cachedUser, sessionToken] = await Promise.all([
        authStorage.getUser(),
        authStorage.getSessionToken(),
      ]);

      if (!active) return;
      if (cachedUser && sessionToken) {
        await authStorage.clearAccessToken();
        if (!active) return;
        setUser(cachedUser);
        setEntryMode("device-login");
      } else {
        setUser(null);
        setEntryMode("first-login");
      }
      setStatus("unauthenticated");
    };

    void hydrate();
    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(
    async (credentials: LoginCredentials): Promise<void> => {
      const response = await loginUser(credentials);
      await Promise.all([
        authStorage.setAccessToken(response.token.accessToken),
        authStorage.setSessionToken(response.session.sessionToken),
        authStorage.setUser(response.user),
      ]);
      setUser(response.user);
      setEntryMode("device-login");
      setStatus("authenticated");
    },
    [],
  );

  const deviceLogin = useCallback(
    async ({ password }: DeviceLoginCredentials): Promise<void> => {
      const response = await loginRegisteredDevice(password);
      await Promise.all([
        authStorage.setAccessToken(response.token.accessToken),
        authStorage.setSessionToken(response.session.sessionToken),
        authStorage.setUser(response.user),
      ]);
      setUser(response.user);
      setEntryMode("device-login");
      setStatus("authenticated");
    },
    [],
  );

  const useAnotherAccount = useCallback(async (): Promise<void> => {
    await authStorage.clearAuthentication();
    setUser(null);
    setEntryMode("first-login");
    setStatus("unauthenticated");
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    await authStorage.clearAccessToken();
    setEntryMode(user ? "device-login" : "first-login");
    setStatus("unauthenticated");
  }, [user]);

  const value = useMemo(
    () => ({
      status,
      entryMode,
      user,
      login,
      deviceLogin,
      useAnotherAccount,
      logout,
    }),
    [status, entryMode, user, login, deviceLogin, useAnotherAccount, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
