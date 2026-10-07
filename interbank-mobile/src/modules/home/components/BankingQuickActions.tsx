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

import { HOME_COLORS } from "@/src/modules/home/theme/home.theme";
import { LiquidGlassSurface } from "@/src/shared/components/LiquidGlassSurface";

interface ActionItem {
  code: string;
  label: string;
  icon: LucideIcon;
  color?: string;
  badge?: string;
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
    badge: "Nuevo",
  },
  { code: "ADD_PRODUCT", label: "Agregar producto", icon: Plus },
  { code: "ALL", label: "Ver todo", icon: Grid2X2, color: "#53645B" },
];

interface BankingQuickActionsProps {
  onAction?: (code: string) => void;
}

export function BankingQuickActions({ onAction }: BankingQuickActionsProps) {
  return (
    <View className="flex-row flex-wrap px-4 pt-5">
      {ACTIONS.map(
        ({ code, label, icon: Icon, color = HOME_COLORS.green, badge }) => (
          <Pressable
            accessibilityLabel={label}
            accessibilityRole="button"
            key={code}
            onPress={() => onAction?.(code)}
            className="mb-4 w-1/4 items-center px-1"
          >
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
              {badge ? (
                <Text className="absolute -top-0.5 right-0 rounded-full bg-blue-700 px-1.5 py-0.5 text-[8px] font-bold text-white">
                  {badge}
                </Text>
              ) : null}
              <Icon color={color} size={26} strokeWidth={2.1} />
            </LiquidGlassSurface>
            <Text className="mt-1.5 text-center text-[10px] font-semibold leading-3 text-green-950/80">
              {label}
            </Text>
          </Pressable>
        ),
      )}
    </View>
  );
}
