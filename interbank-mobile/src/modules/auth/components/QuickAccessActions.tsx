import { CreditCard, QrCode, Smartphone } from "lucide-react-native";
import React from "react";
import { Pressable, Text, View } from "react-native";

const ACTIONS = [
  { key: "block-card", label: "Bloquear\ntarjeta", Icon: CreditCard },
  { key: "qr", label: "Pagar con\nQR", Icon: QrCode },
  { key: "phone", label: "Pagar a\ncelular", Icon: Smartphone },
] as const;

export function QuickAccessActions({ onPress }: { onPress: (key: string) => void }) {
  return (
    <View className="mt-8">
      <Text className="mb-4 text-[14px] font-bold text-[#34443b]">Accesos rápidos</Text>
      <View className="flex-row justify-between gap-3">
        {ACTIONS.map(({ key, label, Icon }) => (
          <Pressable
            key={key}
            onPress={() => onPress(key)}
            className="min-h-[104px] flex-1 items-center justify-center rounded-2xl border border-[#dce4df] bg-white px-2 active:bg-[#edf7f0]"
            accessibilityRole="button"
          >
            <Icon color="#008f39" size={24} strokeWidth={2.2} />
            <Text className="mt-2 text-center text-[12px] font-semibold leading-4 text-[#34443b]">
              {label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
