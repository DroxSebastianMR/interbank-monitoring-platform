import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

import type { AuthUser } from "@/src/modules/auth/types/auth.types";
import { biometricLoginService } from "@/src/infrastructure/device/biometric-login.service";

const KEYS = {
  accessToken: "interbank.access-token",
  sessionToken: "interbank.session-token",
  deviceId: "interbank.device-id",
  user: "interbank.user",
} as const;

async function setItem(key: string, value: string): Promise<void> {
  if (Platform.OS === "web") {
    globalThis.localStorage?.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function getItem(key: string): Promise<string | null> {
  if (Platform.OS === "web")
    return globalThis.localStorage?.getItem(key) ?? null;
  return SecureStore.getItemAsync(key);
}

async function deleteItem(key: string): Promise<void> {
  if (Platform.OS === "web") {
    globalThis.localStorage?.removeItem(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

const createDeviceId = (): string => {
  const random = Math.random().toString(16).slice(2).padEnd(12, "0");
  const time = Date.now().toString(16).padStart(12, "0");
  return `${time.slice(0, 8)}-${time.slice(8, 12)}-4${random.slice(0, 3)}-8${random.slice(3, 6)}-${random.slice(6, 18).padEnd(12, "0")}`;
};

export const authStorage = {
  setAccessToken: (token: string) => setItem(KEYS.accessToken, token),
  getAccessToken: () => getItem(KEYS.accessToken),

  setSessionToken: (token: string) => setItem(KEYS.sessionToken, token),
  getSessionToken: () => getItem(KEYS.sessionToken),
  getDeviceId: () => getItem(KEYS.deviceId),

  async getOrCreateDeviceId(): Promise<string> {
    const stored = await getItem(KEYS.deviceId);
    if (stored) return stored;
    const generated = createDeviceId();
    await setItem(KEYS.deviceId, generated);
    return generated;
  },

  async setUser(user: AuthUser): Promise<void> {
    await setItem(KEYS.user, JSON.stringify(user));
  },

  async getUser(): Promise<AuthUser | null> {
    const value = await getItem(KEYS.user);
    if (!value) return null;
    try {
      return JSON.parse(value) as AuthUser;
    } catch {
      await deleteItem(KEYS.user);
      return null;
    }
  },

  async clearAuthentication(): Promise<void> {
    await Promise.all([
      deleteItem(KEYS.accessToken),
      deleteItem(KEYS.sessionToken),
      deleteItem(KEYS.user),
      biometricLoginService.clear(),
    ]);
  },

  clearAccessToken: () => deleteItem(KEYS.accessToken),
};
