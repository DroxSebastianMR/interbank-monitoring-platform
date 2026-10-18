import { Bell, Search } from "lucide-react-native";
import React from "react";
import { Pressable, Text, View } from "react-native";

import { LiquidGlassSurface } from "@/src/shared/components/LiquidGlassSurface";

interface HomeHeaderProps {
  firstName: string;
}

export function HomeHeader({ firstName }: HomeHeaderProps) {
  const initials = firstName.slice(0, 2).toUpperCase();

  return (
    <View className="px-5 pt-2">
      <View className="flex-row items-center gap-2.5">
        <LiquidGlassSurface className="h-10 w-10 items-center justify-center rounded-full">
          <Text className="text-sm font-bold text-white">{initials}</Text>
        </LiquidGlassSurface>

        <LiquidGlassSurface className="h-10 flex-1 flex-row items-center rounded-full px-4">
          <Search color="rgba(255,255,255,0.88)" size={16} />
          <Text className="ml-2 text-xs font-medium text-white/90">
            Buscar en Interbank
          </Text>
        </LiquidGlassSurface>

        <Pressable accessibilityLabel="Notificaciones">
          <LiquidGlassSurface className="h-10 w-10 items-center justify-center rounded-full">
            <Bell color="#FFFFFF" size={18} />
            <View className="absolute right-2 top-2 h-2 w-2 rounded-full border border-green-700 bg-lime-300" />
          </LiquidGlassSurface>
        </Pressable>
      </View>

      <View className="flex-row items-baseline pt-4">
        <Text className="text-[17px] font-medium text-white/85">
          Buenos días,
        </Text>
        <Text
          className="ml-1.5 flex-shrink text-[21px] font-extrabold tracking-tight text-white"
          numberOfLines={1}
        >
          {firstName}
        </Text>
      </View>
    </View>
  );
}
