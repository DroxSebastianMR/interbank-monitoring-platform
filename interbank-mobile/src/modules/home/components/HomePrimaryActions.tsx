import { QrCode, Send } from "lucide-react-native";
import React from "react";
import { Pressable, Text } from "react-native";

import { HOME_COLORS } from "@/src/modules/home/theme/home.theme";
import { LiquidGlassSurface } from "@/src/shared/components/LiquidGlassSurface";

interface HomePrimaryActionsProps {
  onQrPress?: () => void;
  onPlinearPress?: () => void;
}

export function HomePrimaryActions({
  onQrPress,
  onPlinearPress,
}: HomePrimaryActionsProps) {
  return (
    <LiquidGlassSurface className="mx-5 mt-4 flex-row gap-2 rounded-[26px] p-2">
      <Pressable
        accessibilityRole="button"
        onPress={onQrPress}
        className="h-12 flex-1 flex-row items-center justify-center rounded-[20px] bg-white/80"
      >
        <QrCode color={HOME_COLORS.greenDeep} size={19} />
        <Text className="ml-2 text-sm font-bold text-green-900">
          Escanear QR
        </Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        onPress={onPlinearPress}
        className="h-12 flex-1 flex-row items-center justify-center rounded-[20px] bg-blue-600"
        style={{
          elevation: 5,
          shadowColor: HOME_COLORS.blue,
          shadowOpacity: 0.35,
          shadowRadius: 9,
        }}
      >
        <Send color="#FFFFFF" size={18} />
        <Text className="ml-2 text-sm font-bold text-white">Plinear</Text>
      </Pressable>
    </LiquidGlassSurface>
  );
}
