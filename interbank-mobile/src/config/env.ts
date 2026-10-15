import { Platform } from "react-native";

const nativeApiUrl = process.env.EXPO_PUBLIC_API_URL || "http://localhost:8080";
const webApiUrl =
  process.env.EXPO_PUBLIC_WEB_API_URL || "http://localhost:8080";

export const ENV = {
  API_BASE_URL: Platform.OS === "web" ? webApiUrl : nativeApiUrl,
  API_TIMEOUT: 10_000,
};
