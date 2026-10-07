import { View } from "react-native";

import { PromotionCard } from "@/src/modules/home/components/PromotionCard";
import { PromotionCarousel } from "@/src/modules/home/components/PromotionCarousel";
import { PromotionShortcut } from "@/src/modules/home/components/PromotionShortcut";
import type {
    HomePromotion,
    HomePromotionShortcut,
} from "@/src/modules/home/models/home-promotion.model";

interface HomePromotionsProps {
  items: HomePromotion[];
  shortcuts?: HomePromotionShortcut[];
  onPromotionPress?: (item: HomePromotion) => void;
  onShortcutPress?: (item: HomePromotionShortcut) => void;
}

export function HomePromotions({
  items,
  shortcuts = [],
  onPromotionPress,
  onShortcutPress,
}: HomePromotionsProps) {
  if (items.length === 0) return null;

  return (
    <View className="pt-5">
      <PromotionCarousel
        items={items}
        keyExtractor={(item) => item.id}
        renderItem={(item, width) => (
          <PromotionCard
            item={item}
            onPress={onPromotionPress}
            width={width}
          />
        )}
      />

      {shortcuts.length > 0 ? (
        <View className="mt-4 flex-row gap-2.5 px-5">
          {shortcuts.map((item) => (
            <PromotionShortcut
              item={item}
              key={item.id}
              onPress={onShortcutPress}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}
