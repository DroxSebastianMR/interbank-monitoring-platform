import { MessageCircle, ShieldCheck } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";

import type { HomePromotionShortcut } from "@/src/modules/home/models/home-promotion.model";

interface PromotionShortcutProps {
  item: HomePromotionShortcut;
  onPress?: (item: HomePromotionShortcut) => void;
}

export function PromotionShortcut({ item, onPress }: PromotionShortcutProps) {
  const isWhatsApp = item.variant === "whatsapp";
  const Icon = isWhatsApp ? MessageCircle : ShieldCheck;

  return (
    <Pressable
      accessibilityLabel={item.label}
      accessibilityRole="button"
      className={`h-11 flex-1 flex-row items-center rounded-full border px-2.5 ${
        isWhatsApp
          ? "border-emerald-100 bg-emerald-50"
          : "border-blue-100 bg-blue-50"
      }`}
      onPress={() => onPress?.(item)}
    >
      <View
        className={`h-7 w-7 items-center justify-center rounded-full ${
          isWhatsApp ? "bg-emerald-500" : "bg-blue-700"
        }`}
      >
        <Icon color="#FFFFFF" size={15} strokeWidth={2.2} />
      </View>
      <Text
        className={`ml-2 flex-1 text-[10px] font-bold ${
          isWhatsApp ? "text-emerald-800" : "text-blue-800"
        }`}
        numberOfLines={1}
      >
        {item.label}
      </Text>
    </Pressable>
  );
}
