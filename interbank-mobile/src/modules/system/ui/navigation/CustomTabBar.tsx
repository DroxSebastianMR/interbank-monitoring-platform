import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import {
  ArrowLeftRight,
  Home,
  ScanLine,
  Tag,
  WalletCards,
} from "lucide-react-native";
import React from "react";
import { Pressable, Text, useWindowDimensions, View } from "react-native";

import { LiquidGlassSurface } from "@/src/shared/components/LiquidGlassSurface";
import {
  HapticType,
  triggerHaptic,
} from "@/src/shared/haptics/haptics.service";
import { BANKING_COLORS } from "@/src/shared/theme/banking.theme";

const TABS = {
  Home: { icon: Home, label: "Inicio" },
  Accounts: { icon: ArrowLeftRight, label: "Movimientos" },
  Payments: { icon: Tag, label: "Beneficios" },
  Profile: { icon: WalletCards, label: "Para ti" },
} as const;

export function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const { width } = useWindowDimensions();
  const containerWidth = Math.min(width, 430);
  const mainRoutes = state.routes.filter((route) => route.name !== "QrPayment");
  const qrRoute = state.routes.find((route) => route.name === "QrPayment");

  return (
    <View
      pointerEvents="box-none"
      className="absolute bottom-5 flex-row items-center gap-2.5 px-4"
      style={{ left: (width - containerWidth) / 2, width: containerWidth }}
    >
      <LiquidGlassSurface
        className="h-[66px] flex-1 flex-row items-center rounded-full p-1"
        intensity={55}
        style={{
          elevation: 12,
          shadowColor: BANKING_COLORS.greenDeep,
          shadowOpacity: 0.22,
          shadowRadius: 18,
        }}
      >
        {mainRoutes.map((route) => {
          const routeIndex = state.routes.findIndex(
            (item) => item.key === route.key,
          );
          const focused = state.index === routeIndex;
          const config = TABS[route.name as keyof typeof TABS];
          if (!config) return null;
          const Icon = config.icon;

          return (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: focused }}
              key={route.key}
              onPress={() => {
                if (focused) return;
                void triggerHaptic(HapticType.LIGHT);
                navigation.navigate(route.name);
              }}
              className={`h-14 flex-1 items-center justify-center rounded-full ${focused ? "bg-white/45" : ""}`}
            >
              <Icon
                color={focused ? BANKING_COLORS.greenDeep : "#65736B"}
                size={21}
                strokeWidth={focused ? 2.5 : 1.9}
              />
              <Text
                className={`mt-1 text-[9px] font-bold ${focused ? "text-green-900" : "text-green-950/60"}`}
              >
                {config.label}
              </Text>
            </Pressable>
          );
        })}
      </LiquidGlassSurface>

      <Pressable
        accessibilityLabel="Escanear QR"
        accessibilityRole="button"
        onPress={() => {
          if (!qrRoute) return;
          void triggerHaptic(HapticType.MEDIUM);
          navigation.navigate(qrRoute.name);
        }}
      >
        <LiquidGlassSurface
          className="h-[66px] w-[66px] items-center justify-center rounded-full"
          intensity={60}
          style={{
            elevation: 12,
            shadowColor: BANKING_COLORS.green,
            shadowOpacity: 0.3,
            shadowRadius: 18,
          }}
        >
          <View className="absolute inset-2 rounded-full bg-emerald-200/25" />
          <ScanLine color={BANKING_COLORS.green} size={29} strokeWidth={2.3} />
        </LiquidGlassSurface>
      </Pressable>
    </View>
  );
}
