import Constants, { ExecutionEnvironment } from "expo-constants";
import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

import {
  BiometricAuthError,
  BiometricFailure,
  BiometricKind,
} from "@/src/domain/auth/biometric.types";
import type { BiometricCapability } from "@/src/domain/auth/biometric.types";

const VAULT_KEY = "interbank.biometric-credential.v2";
const BINDING_KEY = "interbank.biometric-binding.v2";
const VAULT_OPTIONS: SecureStore.SecureStoreOptions = {
  keychainService: "interbank.biometric-login.v2",
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  requireAuthentication: true,
  authenticationPrompt: "Confirma tu identidad para ingresar a Interbank",
};

interface DeviceBinding {
  userId: string;
  deviceId: string;
}

interface ProtectedCredential extends DeviceBinding {
  credential: string;
}

async function clearLegacyPassword(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync("interbank.biometric-credential.v1", {
      keychainService: "interbank.biometric-login.v1",
    }),
    SecureStore.deleteItemAsync("interbank.biometric-binding.v1"),
  ]);
}

async function clear(): Promise<void> {
  if (Platform.OS === "web") return;
  await Promise.all([
    SecureStore.deleteItemAsync(VAULT_KEY, {
      keychainService: VAULT_OPTIONS.keychainService,
    }),
    SecureStore.deleteItemAsync(BINDING_KEY),
    clearLegacyPassword(),
  ]);
}

async function capability(): Promise<BiometricCapability> {
  if (Platform.OS !== "web") await clearLegacyPassword();
  const kind =
    Platform.OS === "ios"
      ? BiometricKind.FACE_ID
      : Platform.OS === "android"
        ? BiometricKind.FINGERPRINT
        : BiometricKind.NONE;
  if (
    kind === BiometricKind.NONE ||
    (Platform.OS === "ios" &&
      Constants.executionEnvironment === ExecutionEnvironment.StoreClient)
  ) {
    return { kind, available: false };
  }
  try {
    const [hardware, enrolled, types, level] = await Promise.all([
      LocalAuthentication.hasHardwareAsync(),
      LocalAuthentication.isEnrolledAsync(),
      LocalAuthentication.supportedAuthenticationTypesAsync(),
      LocalAuthentication.getEnrolledLevelAsync(),
    ]);
    const requiredType =
      kind === BiometricKind.FACE_ID
        ? LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION
        : LocalAuthentication.AuthenticationType.FINGERPRINT;
    return {
      kind,
      available:
        hardware &&
        enrolled &&
        types.includes(requiredType) &&
        level === LocalAuthentication.SecurityLevel.BIOMETRIC_STRONG &&
        SecureStore.canUseBiometricAuthentication(),
    };
  } catch {
    return { kind, available: false };
  }
}

async function isEnabled(binding: DeviceBinding): Promise<boolean> {
  if (Platform.OS === "web") return false;
  await clearLegacyPassword();
  const stored = await SecureStore.getItemAsync(BINDING_KEY);
  if (!stored) return false;
  try {
    const value: unknown = JSON.parse(stored);
    return (
      typeof value === "object" &&
      value !== null &&
      "userId" in value &&
      "deviceId" in value &&
      value.userId === binding.userId &&
      value.deviceId === binding.deviceId
    );
  } catch {
    return false;
  }
}

async function enable(credential: ProtectedCredential): Promise<void> {
  const status = await capability();
  if (!status.available)
    throw new BiometricAuthError(BiometricFailure.UNAVAILABLE);
  // Creating a Keychain item on iOS does not prompt. Verify the user explicitly.
  // Android's authenticated keystore write presents its own biometric prompt.
  if (Platform.OS === "ios") {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "Activar Face ID para Interbank",
      cancelLabel: "Cancelar",
      disableDeviceFallback: true,
      fallbackLabel: "",
      biometricsSecurityLevel: "strong",
    });
    if (!result.success) {
      const canceled = [
        "user_cancel",
        "app_cancel",
        "system_cancel",
        "user_fallback",
      ].includes(result.error);
      throw new BiometricAuthError(
        canceled ? BiometricFailure.CANCELED : BiometricFailure.FAILED,
      );
    }
  }
  await clear();
  try {
    await SecureStore.setItemAsync(
      VAULT_KEY,
      JSON.stringify(credential),
      VAULT_OPTIONS,
    );
    await SecureStore.setItemAsync(
      BINDING_KEY,
      JSON.stringify({
        userId: credential.userId,
        deviceId: credential.deviceId,
      }),
    );
  } catch {
    await clear();
    throw new BiometricAuthError(BiometricFailure.FAILED);
  }
}

async function unlock(binding: DeviceBinding): Promise<string> {
  if (!(await capability()).available)
    throw new BiometricAuthError(BiometricFailure.UNAVAILABLE);
  if (!(await isEnabled(binding)))
    throw new BiometricAuthError(BiometricFailure.INVALIDATED);
  let stored: string | null;
  try {
    // The OS authenticates before releasing the credential. A local prompt alone
    // must never be treated as successful server authentication.
    stored = await SecureStore.getItemAsync(VAULT_KEY, VAULT_OPTIONS);
  } catch {
    throw new BiometricAuthError(BiometricFailure.FAILED);
  }
  if (!stored) {
    await clear();
    throw new BiometricAuthError(BiometricFailure.INVALIDATED);
  }
  try {
    const value: unknown = JSON.parse(stored);
    if (
      typeof value !== "object" ||
      value === null ||
      !("userId" in value) ||
      !("deviceId" in value) ||
      !("credential" in value) ||
      value.userId !== binding.userId ||
      value.deviceId !== binding.deviceId ||
      typeof value.credential !== "string" ||
      value.credential.length < 32
    ) {
      throw new Error("Invalid binding");
    }
    return value.credential;
  } catch {
    await clear();
    throw new BiometricAuthError(BiometricFailure.INVALIDATED);
  }
}

export const biometricLoginService = {
  capability,
  isEnabled,
  enable,
  unlock,
  clear,
};
