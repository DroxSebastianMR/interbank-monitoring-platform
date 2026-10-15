import Constants from "expo-constants";

export const APP_CONFIG = {
  PLATFORM: "MOBILE",
  VERSION: Constants.expoConfig?.version ?? "1.0.0",
  NAME: Constants.expoConfig?.name ?? "interbank-monitor",
};
