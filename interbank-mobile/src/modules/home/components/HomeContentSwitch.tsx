import React from "react";
import { Pressable, Text, View } from "react-native";

import type {
  HomeAccount,
  HomeQuickAction,
} from "@/src/infrastructure/api/home/services/home.types";
import { BankingQuickActions } from "@/src/modules/home/components/BankingQuickActions";
import { HOME_COLORS } from "@/src/modules/home/theme/home.theme";
import { LiquidGlassSurface } from "@/src/shared/components/LiquidGlassSurface";

type HomeSection = "operations" | "products";

interface HomeContentSwitchProps {
  accounts: HomeAccount[];
  quickActions?: HomeQuickAction[];
  selected: HomeSection;
  onChange: (section: HomeSection) => void;
  onAction?: (code: string) => void;
}

export function HomeContentSwitch({
  accounts,
  quickActions,
  selected,
  onChange,
  onAction,
}: HomeContentSwitchProps) {
  return (
    <View>
      <LiquidGlassSurface
        className="mx-5 flex-row rounded-full p-1"
        intensity={24}
        tone="blue"
      >
        <SegmentButton
          active={selected === "operations"}
          label="Mis operaciones"
          onPress={() => onChange("operations")}
        />
        <SegmentButton
          active={selected === "products"}
          label="Mis productos"
          onPress={() => onChange("products")}
        />
      </LiquidGlassSurface>

      {selected === "operations" ? (
        <BankingQuickActions actions={quickActions} onAction={onAction} />
      ) : (
        <View className="px-5 pt-4">
          {accounts.map((account) => (
            <LiquidGlassSurface
              key={account.id}
              className="mb-3 rounded-3xl px-4 py-4"
              tone="neutral"
            >
              <Text className="font-bold text-green-950">
                {account.displayName}
              </Text>
              <View className="mt-1 flex-row items-center justify-between">
                <Text className="text-xs text-green-950/60">
                  {account.maskedAccountNumber}
                </Text>
                <Text className="font-extrabold text-green-900">
                  {account.currency === "PEN" ? "S/" : "$"}{" "}
                  {account.availableBalance}
                </Text>
              </View>
            </LiquidGlassSurface>
          ))}
        </View>
      )}
    </View>
  );
}

interface SegmentButtonProps {
  active: boolean;
  label: string;
  onPress: () => void;
}

function SegmentButton({ active, label, onPress }: SegmentButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      className={`h-10 flex-1 items-center justify-center rounded-full ${active ? "bg-blue-600" : ""}`}
      style={
        active
          ? {
              elevation: 2,
              shadowColor: HOME_COLORS.blue,
              shadowOffset: { width: 0, height: 3 },
              shadowOpacity: 0.2,
              shadowRadius: 7,
            }
          : undefined
      }
    >
      <Text
        className={`text-[13px] font-bold ${active ? "text-white" : "text-slate-600"}`}
      >
        {label}
      </Text>
    </Pressable>
  );
}
