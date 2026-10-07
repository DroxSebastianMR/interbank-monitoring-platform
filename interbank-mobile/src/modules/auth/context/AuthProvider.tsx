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
import {
  disableDeviceBiometrics,
  enableDeviceBiometrics,
  loginWithDeviceBiometrics,
} from "@/src/domain/auth/biometric-login.usecase";
import {
  BiometricAuthError,
  BiometricFailure,
} from "@/src/domain/auth/biometric.types";
import { authStorage } from "@/src/modules/auth/storage/auth.storage";
import type {
  AuthStatus,
  AuthEntryMode,
  AuthUser,
  DeviceLoginCredentials,
  DeviceLoginResult,
  LoginCredentials,
} from "@/src/modules/auth/types/auth.types";

interface AuthContextValue {
  status: AuthStatus;
  entryMode: AuthEntryMode;
  user: AuthUser | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  deviceLogin: (
    credentials: DeviceLoginCredentials,
  ) => Promise<DeviceLoginResult>;
  biometricLogin: () => Promise<void>;
  useAnotherAccount: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("checking");
  const [entryMode, setEntryMode] = useState<AuthEntryMode>("first-login");
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
      await disableDeviceBiometrics();
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
    async ({
      password,
      enableBiometrics,
    }: DeviceLoginCredentials): Promise<DeviceLoginResult> => {
      const response = await loginRegisteredDevice(password);
      await Promise.all([
        authStorage.setAccessToken(response.token.accessToken),
        authStorage.setSessionToken(response.session.sessionToken),
        authStorage.setUser(response.user),
      ]);
      const result: DeviceLoginResult = { biometricsActivated: false };
      if (enableBiometrics) {
        try {
          await enableDeviceBiometrics(password);
          result.biometricsActivated = true;
        } catch (error) {
          result.biometricError =
            error instanceof BiometricAuthError
              ? error.code
              : BiometricFailure.FAILED;
        }
      }
      setUser(response.user);
      setEntryMode("device-login");
      setStatus("authenticated");
      return result;
    },
    [],
  );

  const biometricLogin = useCallback(async (): Promise<void> => {
    const response = await loginWithDeviceBiometrics();
    await Promise.all([
      authStorage.setAccessToken(response.token.accessToken),
      authStorage.setSessionToken(response.session.sessionToken),
      authStorage.setUser(response.user),
    ]);
    setUser(response.user);
    setEntryMode("device-login");
    setStatus("authenticated");
  }, []);

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
      biometricLogin,
      useAnotherAccount,
      logout,
    }),
    [
      status,
      entryMode,
      user,
      login,
      deviceLogin,
      biometricLogin,
      useAnotherAccount,
      logout,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
