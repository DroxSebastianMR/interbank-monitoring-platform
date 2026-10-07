import { triggerToastHaptic } from "@/src/modules/system/haptics/hapticsToast";
import { ToastPayload } from "@/src/modules/system/ui/types";
import { useEffect, useMemo } from "react";
import { Text, View } from "react-native";

export const GlobalToast = ({ toast }: { toast: ToastPayload }) => {
  const type = useMemo(() => toast.type ?? "info", [toast.type]);

  const bg =
    type === "error"
      ? "bg-red-600"
      : type === "success"
        ? "bg-green-600"
        : "bg-gray-800";

  useEffect(() => {
    triggerToastHaptic(type);
  }, [type]);

  return (
    <View className="absolute top-12 self-center px-6 py-3 rounded-xl z-50">
      <View className={`${bg} px-4 py-3 rounded-xl shadow-lg`}>
        <Text className="text-white font-medium">{toast.message}</Text>
      </View>
    </View>
  );
};
