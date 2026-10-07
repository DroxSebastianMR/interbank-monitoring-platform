import type { AuthApiResponse } from "@/src/infrastructure/api/auth/services/auth.types";
import { biometricLoginService } from "@/src/infrastructure/device/biometric-login.service";
import { authStorage } from "@/src/modules/auth/storage/auth.storage";
import { loginRegisteredDevice } from "@/src/domain/auth/auth.usecase";
import {
  BiometricAuthError,
  BiometricFailure,
} from "@/src/domain/auth/biometric.types";

async function registeredBinding() {
  const [user, deviceId, sessionToken] = await Promise.all([
    authStorage.getUser(),
    authStorage.getDeviceId(),
    authStorage.getSessionToken(),
  ]);
  if (!user || !deviceId || !sessionToken)
    throw new Error("DEVICE_SESSION_NOT_FOUND");
  return { userId: user.id, deviceId };
}

export async function getDeviceBiometricState() {
  const capability = await biometricLoginService.capability();
  if (!capability.available) return { ...capability, enabled: false };
  const binding = await registeredBinding();
  return {
    ...capability,
    enabled: await biometricLoginService.isEnabled(binding),
  };
}

export async function enableDeviceBiometrics(password: string): Promise<void> {
  if (password.length < 8) throw new Error("INVALID_PASSWORD");
  const binding = await registeredBinding();
  await biometricLoginService.enable({ ...binding, password });
}

export async function disableDeviceBiometrics(): Promise<void> {
  await biometricLoginService.clear();
}

export async function loginWithDeviceBiometrics(): Promise<AuthApiResponse> {
  const binding = await registeredBinding();
  let password = await biometricLoginService.unlock(binding);
  try {
    const response = await loginRegisteredDevice(password);
    if (
      response.user.id !== binding.userId ||
      response.session.deviceId !== binding.deviceId
    ) {
      await biometricLoginService.clear();
      throw new BiometricAuthError(BiometricFailure.INVALIDATED);
    }
    return response;
  } finally {
    password = "";
  }
}
