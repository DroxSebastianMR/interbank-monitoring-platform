import { ToastType } from "@/src/modules/system/ui/types";
import * as Haptics from "expo-haptics";

export const triggerToastHaptic = async (type: ToastType) => {
  switch (type) {
    case "success":
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      break;

    case "error":
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      break;

    case "info":
    default:
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      break;
  }
};
