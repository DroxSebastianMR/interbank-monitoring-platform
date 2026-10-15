import { useWindowDimensions, View } from "react-native";

import { HOME_LAYOUT } from "@/src/modules/home/theme/home.theme";
import { ContentSectionSurface } from "@/src/shared/components/ContentSectionSurface";
import { Skeleton } from "@/src/shared/components/Skeleton";

const PROMOTION_MAX_WIDTH = 326;

export function HomeScreenSkeleton() {
  const { width } = useWindowDimensions();
  const viewportWidth = Math.min(width, HOME_LAYOUT.maxContentWidth);
  const contentWidth = viewportWidth - HOME_LAYOUT.horizontalPadding * 2;
  const balanceWidth = Math.min(
    viewportWidth - HOME_LAYOUT.cardWidthOffset,
    350,
  );
  const promotionWidth = Math.min(
    PROMOTION_MAX_WIDTH,
    contentWidth * 0.92,
  );
  const shortcutWidth = (contentWidth - 10) / 2;

  return (
    <View accessibilityLabel="Cargando inicio" accessibilityRole="progressbar">
      <View
        style={{
          paddingHorizontal: HOME_LAYOUT.horizontalPadding,
          paddingTop: 16,
        }}
      >
        <Skeleton
          borderRadius={26}
          height={balanceWidth / 1.58}
          style={{ backgroundColor: "rgba(255,255,255,0.34)" }}
          width={balanceWidth}
        />
      </View>

      <View
        className="flex-row rounded-[26px] bg-white/20 p-2"
        style={{
          gap: 8,
          marginHorizontal: HOME_LAYOUT.horizontalPadding,
          marginTop: 16,
        }}
      >
        <Skeleton
          borderRadius={20}
          height={48}
          style={{ backgroundColor: "rgba(255,255,255,0.68)" }}
          width={(contentWidth - 24) / 2}
        />
        <Skeleton
          borderRadius={20}
          height={48}
          style={{ backgroundColor: "rgba(120,171,229,0.68)" }}
          width={(contentWidth - 24) / 2}
        />
      </View>

      <ContentSectionSurface>
        <Skeleton
          borderRadius={999}
          height={48}
          style={{
            marginHorizontal: HOME_LAYOUT.horizontalPadding,
            backgroundColor: "#DDE9E2",
          }}
          width={contentWidth}
        />

        <View className="flex-row flex-wrap px-4 pt-5">
          {Array.from({ length: 8 }, (_, index) => (
            <View className="mb-4 w-1/4 items-center px-1" key={index}>
              <Skeleton borderRadius={22} height={64} width={64} />
              <Skeleton
                borderRadius={5}
                height={8}
                style={{ marginTop: 8 }}
                width={46}
              />
            </View>
          ))}
        </View>

        <View style={{ paddingTop: 12 }}>
          <Skeleton
            borderRadius={30}
            height={178}
            style={{
              marginLeft: HOME_LAYOUT.horizontalPadding,
              backgroundColor: "#DCEBDD",
            }}
            width={promotionWidth}
          />
          <View className="mt-4 flex-row" style={{ gap: 10 }}>
            <Skeleton
              borderRadius={999}
              height={44}
              style={{ marginLeft: HOME_LAYOUT.horizontalPadding }}
              width={shortcutWidth}
            />
            <Skeleton borderRadius={999} height={44} width={shortcutWidth} />
          </View>
        </View>

        <View
          style={{
            paddingHorizontal: HOME_LAYOUT.horizontalPadding,
            paddingTop: 24,
          }}
        >
          <View className="mb-4 flex-row items-center justify-between">
            <Skeleton borderRadius={6} height={18} width={144} />
            <Skeleton borderRadius={6} height={12} width={58} />
          </View>
          <View className="rounded-[26px] bg-white/70 px-4">
            {Array.from({ length: 3 }, (_, index) => (
              <View
                className={`flex-row items-center py-4 ${
                  index ? "border-t border-slate-100" : ""
                }`}
                key={index}
              >
                <Skeleton borderRadius={999} height={40} width={40} />
                <View className="ml-3 flex-1">
                  <Skeleton borderRadius={6} height={13} width="78%" />
                  <Skeleton
                    borderRadius={5}
                    height={10}
                    style={{ marginTop: 7 }}
                    width="52%"
                  />
                </View>
                <Skeleton borderRadius={6} height={14} width={62} />
              </View>
            ))}
          </View>
        </View>
      </ContentSectionSurface>
    </View>
  );
}
