import {
  ArrowLeftRight,
  CreditCard,
  Grid2X2,
  Lightbulb,
  Plus,
  RefreshCcw,
  Send,
  Smartphone,
} from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";
import React from "react";
import { Pressable, Text, View } from "react-native";

import type { HomeQuickAction } from "@/src/infrastructure/api/home/services/home.types";
import { HOME_COLORS } from "@/src/modules/home/theme/home.theme";
import { LiquidGlassSurface } from "@/src/shared/components/LiquidGlassSurface";

interface ActionItem {
  code: string;
  label: string;
  icon: LucideIcon;
  color?: string;
}

const ACTIONS: ActionItem[] = [
  { code: "PLINEAR", label: "Plinear", icon: Send },
  { code: "TRANSFER", label: "Transferir", icon: ArrowLeftRight },
  { code: "SERVICE_PAYMENT", label: "Pagar servicios", icon: Lightbulb },
  { code: "MOBILE_TOP_UP", label: "Recargar celular", icon: Smartphone },
  { code: "EXCHANGE", label: "Cambiar moneda", icon: RefreshCcw },
  {
    code: "CARD",
    label: "Ver tarjeta",
    icon: CreditCard,
    color: HOME_COLORS.blue,
  },
  { code: "ADD_PRODUCT", label: "Agregar producto", icon: Plus },
  { code: "ALL", label: "Ver todo", icon: Grid2X2, color: "#53645B" },
];

interface BankingQuickActionsProps {
  actions?: HomeQuickAction[];
  onAction?: (code: string) => void;
}

export function BankingQuickActions({
  actions = [],
  onAction,
}: BankingQuickActionsProps) {
  const actionBadges = new Map(
    actions.map(({ badge, code }) => [code, badge] as const),
  );

  return (
    <View className="flex-row flex-wrap px-4 pt-5">
      {ACTIONS.map(
        ({
          code,
          label,
          icon: Icon,
          color = HOME_COLORS.green,
        }) => (
          <Pressable
            accessibilityLabel={label}
            accessibilityRole="button"
            key={code}
            onPress={() => onAction?.(code)}
            className="mb-4 w-1/4 items-center px-1"
          >
            <View className="relative h-[70px] w-[70px] items-center justify-center">
              <LiquidGlassSurface
                className="h-16 w-16 items-center justify-center rounded-[22px]"
                intensity={24}
                tone={code === "CARD" ? "blue" : "green"}
                style={{
                  elevation: 2,
                  shadowColor: HOME_COLORS.greenDeep,
                  shadowOpacity: 0.12,
                  shadowRadius: 9,
                }}
              >
                <Icon color={color} size={26} strokeWidth={2.1} />
              </LiquidGlassSurface>
              {actionBadges.get(code) ? (
                <View
                  pointerEvents="none"
                  className="absolute right-0 top-0 z-10 rounded-full border-2 border-[#F7FAF8] bg-blue-700 px-2 py-0.5"
                  style={{ elevation: 5 }}
                >
                  <Text className="text-[9px] font-extrabold leading-3 text-white">
                    {actionBadges.get(code)}
                  </Text>
                </View>
              ) : null}
            </View>
            <Text className="mt-1.5 text-center text-[10px] font-semibold leading-3 text-green-950/80">
              {label}
            </Text>
          </Pressable>
        ),
      )}
    </View>
  );
}
