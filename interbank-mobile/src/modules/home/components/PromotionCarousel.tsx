import type { ReactNode } from "react";
import { useState } from "react";
import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native";
import { ScrollView, useWindowDimensions, View } from "react-native";

import { HOME_LAYOUT } from "@/src/modules/home/theme/home.theme";

const DEFAULT_GAP = 14;
const DEFAULT_MAX_ITEM_WIDTH = 326;

interface PromotionCarouselProps<T> {
  items: T[];
  keyExtractor: (item: T) => string;
  renderItem: (item: T, width: number) => ReactNode;
  gap?: number;
  maxItemWidth?: number;
}

/**
 * Reusable horizontal carousel with responsive sizing, snapping and pagination.
 * The card content stays outside this component so other promotion formats can
 * reuse the same interaction without inheriting Home-specific artwork.
 */
export function PromotionCarousel<T>({
  items,
  keyExtractor,
  renderItem,
  gap = DEFAULT_GAP,
  maxItemWidth = DEFAULT_MAX_ITEM_WIDTH,
}: PromotionCarouselProps<T>) {
  const { width } = useWindowDimensions();
  const [activeIndex, setActiveIndex] = useState(0);
  const viewportWidth = Math.min(width, HOME_LAYOUT.maxContentWidth);
  const availableWidth = viewportWidth - HOME_LAYOUT.horizontalPadding * 2;
  const itemWidth = Math.min(maxItemWidth, availableWidth * 0.92);

  if (items.length === 0) return null;

  const handleMomentumEnd = (
    event: NativeSyntheticEvent<NativeScrollEvent>,
  ) => {
    const nextIndex = Math.round(
      event.nativeEvent.contentOffset.x / (itemWidth + gap),
    );
    setActiveIndex(Math.max(0, Math.min(nextIndex, items.length - 1)));
  };

  return (
    <View>
      <ScrollView
        accessibilityLabel="Beneficios y promociones"
        horizontal
        decelerationRate="fast"
        disableIntervalMomentum
        onMomentumScrollEnd={handleMomentumEnd}
        showsHorizontalScrollIndicator={false}
        snapToAlignment="start"
        snapToInterval={itemWidth + gap}
        contentContainerStyle={{
          gap,
          paddingHorizontal: HOME_LAYOUT.horizontalPadding,
          paddingVertical: 8,
        }}
      >
        {items.map((item) => (
          <View key={keyExtractor(item)}>{renderItem(item, itemWidth)}</View>
        ))}
      </ScrollView>

      {items.length > 1 ? (
        <View className="mt-2 flex-row items-center justify-center gap-1.5">
          {items.map((item, index) => {
            const selected = index === activeIndex;

            return (
              <View
                className={`h-1.5 rounded-full ${
                  selected ? "w-8 bg-[#0A8F4D]" : "w-1.5 bg-[#C9D8CE]"
                }`}
                key={`${keyExtractor(item)}-indicator`}
              />
            );
          })}
        </View>
      ) : null}
    </View>
  );
}
