import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { ChevronRight } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { HomePromotion } from "@/src/modules/home/models/home-promotion.model";

const PROMOTION_STYLES: Record<
  HomePromotion["variant"],
  {
    baseColor: string;
    overlay: readonly [string, string, string];
    accentColor: string;
    textColor: string;
  }
> = {
  cinema: {
    baseColor: "#D8FF7D",
    overlay: [
      "rgba(216,255,125,1)",
      "rgba(216,255,125,0.90)",
      "rgba(216,255,125,0.03)",
    ],
    accentColor: "#00A94F",
    textColor: "#173A27",
  },
  food: {
    baseColor: "#FFD6A6",
    overlay: [
      "rgba(255,214,166,1)",
      "rgba(255,214,166,0.91)",
      "rgba(255,214,166,0.03)",
    ],
    accentColor: "#E66B1A",
    textColor: "#532614",
  },
  security: {
    baseColor: "#CDEAFF",
    overlay: [
      "rgba(205,234,255,1)",
      "rgba(205,234,255,0.91)",
      "rgba(205,234,255,0.03)",
    ],
    accentColor: "#0C55D9",
    textColor: "#123D7A",
  },
};

interface PromotionCardProps {
  item: HomePromotion;
  width: number;
  onPress?: (item: HomePromotion) => void;
}

export function PromotionCard({ item, width, onPress }: PromotionCardProps) {
  const visual = PROMOTION_STYLES[item.variant];

  return (
    <Pressable
      accessibilityHint={item.actionLabel}
      accessibilityLabel={`${item.category}: ${item.title}`}
      accessibilityRole="button"
      onPress={() => onPress?.(item)}
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: visual.baseColor,
          width,
          transform: [{ scale: pressed ? 0.985 : 1 }],
        },
      ]}
    >
      <Image
        cachePolicy="memory-disk"
        contentFit="cover"
        source={{ uri: item.imageUrl }}
        style={styles.image}
        transition={180}
      />
      <LinearGradient
        colors={visual.overlay}
        locations={[0, 0.58, 1]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={StyleSheet.absoluteFill}
      />

      <View
        pointerEvents="none"
        style={[styles.decorativeRing, { borderColor: visual.accentColor }]}
      />

      <View className="w-[74%] flex-1 justify-between px-5 py-[18px]">
        <View className="self-start rounded-full bg-white/90 px-3 py-1.5">
          <Text
            className="text-[10px] font-extrabold uppercase tracking-wide"
            style={{ color: visual.textColor }}
          >
            {item.category}
          </Text>
        </View>
        <View>
          <Text
            className="text-[29px] font-black uppercase leading-[33px]"
            numberOfLines={2}
            style={{ color: visual.textColor }}
          >
            {item.title}
          </Text>
          <Text
            className="mt-1.5 text-[12px] font-semibold leading-4"
            numberOfLines={2}
            style={{ color: visual.textColor, opacity: 0.82 }}
          >
            {item.description}
          </Text>
        </View>
      </View>

      <View
        className="absolute bottom-[18px] right-[18px] h-12 w-12 items-center justify-center rounded-full border-2 border-white/70 bg-white"
        style={styles.actionButton}
      >
        <ChevronRight color={visual.accentColor} size={23} strokeWidth={2.8} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderColor: "rgba(255,255,255,0.72)",
    borderRadius: 30,
    borderWidth: 1,
    elevation: 4,
    height: 178,
    overflow: "hidden",
    shadowColor: "#0B2A1A",
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
  },
  image: {
    bottom: 0,
    position: "absolute",
    right: 0,
    top: 0,
    width: "66%",
  },
  decorativeRing: {
    borderRadius: 58,
    borderWidth: 18,
    height: 116,
    opacity: 0.12,
    position: "absolute",
    right: -30,
    top: -32,
    width: 116,
  },
  actionButton: {
    elevation: 5,
    shadowColor: "#0B2A1A",
    shadowOffset: { height: 4, width: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
  },
});
