import * as Haptics from "expo-haptics";

export enum HapticType {
  LIGHT = "LIGHT",
  MEDIUM = "MEDIUM",
  HEAVY = "HEAVY",
  SUCCESS = "SUCCESS",
  WARNING = "WARNING",
  ERROR = "ERROR",
}

export const triggerHaptic = async (type: HapticType) => {
  try {
    switch (type) {
      case HapticType.LIGHT:
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;

      case HapticType.MEDIUM:
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;

      case HapticType.HEAVY:
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        break;

      case HapticType.SUCCESS:
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success,
        );
        break;

      case HapticType.WARNING:
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Warning,
        );
        break;

      case HapticType.ERROR:
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        break;
    }
  } catch {
    // evita crashes en dispositivos no compatibles
    console.log("Haptics not supported");
  }
};
