import type { AuthApiResponse } from "@/src/infrastructure/api/auth/services/auth.types";
import { authService } from "@/src/infrastructure/api/auth/services/auth.service";
import { biometricLoginService } from "@/src/infrastructure/device/biometric-login.service";
import { authStorage } from "@/src/modules/auth/storage/auth.storage";
import {
  BiometricAuthError,
  BiometricFailure,
} from "@/src/domain/auth/biometric.types";
import { isAxiosError } from "axios";

async function registeredBinding() {
  const [user, deviceId, sessionToken] = await Promise.all([
    authStorage.getUser(),
    authStorage.getDeviceId(),
    authStorage.getSessionToken(),
  ]);
  if (!user || !deviceId || !sessionToken)
    throw new Error("DEVICE_SESSION_NOT_FOUND");
  return { userId: user.id, deviceId, sessionToken };
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
  const issued = await authService.enrollBiometrics({
    sessionToken: binding.sessionToken,
    deviceId: binding.deviceId,
    password,
  });
  try {
    await biometricLoginService.enable({
      userId: binding.userId,
      deviceId: binding.deviceId,
      credential: issued.credential,
    });
  } catch (error) {
    await authService
      .revokeBiometrics({
        credential: issued.credential,
        deviceId: binding.deviceId,
      })
      .catch(() => undefined);
    throw error;
  }
}

export async function disableDeviceBiometrics(): Promise<void> {
  const binding = await registeredBinding();
  if (await biometricLoginService.isEnabled(binding)) {
    const credential = await biometricLoginService.unlock(binding);
    await authService.revokeBiometrics({
      credential,
      deviceId: binding.deviceId,
    });
  }
  await biometricLoginService.clear();
}

export async function loginWithDeviceBiometrics(): Promise<AuthApiResponse> {
  const binding = await registeredBinding();
  const credential = await biometricLoginService.unlock(binding);
  try {
    const response = await authService.biometricLogin({
      credential,
      deviceId: binding.deviceId,
    });
    if (
      response.user.id !== binding.userId ||
      response.session.deviceId !== binding.deviceId
    ) {
      await biometricLoginService.clear();
      throw new BiometricAuthError(BiometricFailure.INVALIDATED);
    }
    return response;
  } catch (error) {
    const unauthorized =
      (isAxiosError(error) && error.response?.status === 401) ||
      (typeof error === "object" &&
        error !== null &&
        "type" in error &&
        error.type === "UNAUTHORIZED");
    if (unauthorized) {
      await biometricLoginService.clear();
      throw new BiometricAuthError(BiometricFailure.INVALIDATED);
    }
    throw error;
  }
}
