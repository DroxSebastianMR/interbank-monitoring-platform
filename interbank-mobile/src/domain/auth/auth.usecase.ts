import * as Device from "expo-device";

import { authService } from "@/src/infrastructure/api/auth/services/auth.service";
import type { AuthApiResponse } from "@/src/infrastructure/api/auth/services/auth.types";
import { authStorage } from "@/src/modules/auth/storage/auth.storage";
import type { LoginCredentials } from "@/src/modules/auth/types/auth.types";
import {
  isValidEmail,
  normalizeEmail,
} from "@/src/shared/validators/email.validator";

const DNI_PATTERN = /^\d{8}$/;

export async function loginUser(
  credentials: LoginCredentials,
): Promise<AuthApiResponse> {
  const documentNumber = credentials.documentNumber.trim();
  const email = normalizeEmail(credentials.email);
  if (!DNI_PATTERN.test(documentNumber)) throw new Error("INVALID_DOCUMENT");
  if (!isValidEmail(email)) throw new Error("INVALID_EMAIL");
  if (credentials.password.length < 8) throw new Error("INVALID_PASSWORD");

  const deviceId = await authStorage.getOrCreateDeviceId();
  return authService.firstLogin({
    documentNumber,
    email,
    password: credentials.password,
    deviceId,
    ...(Device.modelName ? { deviceName: Device.modelName } : {}),
  });
}

export async function loginRegisteredDevice(
  password: string,
): Promise<AuthApiResponse> {
  if (password.length < 8) throw new Error("INVALID_PASSWORD");

  const [sessionToken, deviceId] = await Promise.all([
    authStorage.getSessionToken(),
    authStorage.getDeviceId(),
  ]);

  if (!sessionToken || !deviceId) throw new Error("DEVICE_SESSION_NOT_FOUND");

  return authService.deviceLogin({ sessionToken, deviceId, password });
}
