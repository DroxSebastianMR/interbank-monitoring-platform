import type { BiometricFailure } from "@/src/domain/auth/biometric.types";

export type AuthStatus = "checking" | "authenticated" | "unauthenticated";
export type AuthEntryMode = "first-login" | "device-login";

export interface AuthUser {
  id: string;
  documentNumber: string;
  email: string;
  firstName?: string;
  lastName?: string;
}

export interface LoginCredentials {
  documentNumber: string;
  email: string;
  password: string;
}

export interface DeviceLoginCredentials {
  password: string;
  enableBiometrics?: boolean;
}

export interface DeviceLoginResult {
  biometricsActivated: boolean;
  biometricError?: BiometricFailure;
}
