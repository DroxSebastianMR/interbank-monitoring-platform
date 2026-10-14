import type { NavigationProp } from "@react-navigation/native";
import { useNavigation } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { useCallback, useState } from "react";
import type { LayoutChangeEvent } from "react-native";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import type { TabParamList } from "@/src/application/navigation/TabNavigator";
import { useAuth } from "@/src/modules/auth/context/AuthProvider";
import { BalanceSummaryCard } from "@/src/modules/home/components/BalanceSummaryCard";
import { HomeAmbientBackground } from "@/src/modules/home/components/HomeAmbientBackground";
import { HomeContentSwitch } from "@/src/modules/home/components/HomeContentSwitch";
import { HomeHeader } from "@/src/modules/home/components/HomeHeader";
import { HomePrimaryActions } from "@/src/modules/home/components/HomePrimaryActions";
import { HomePromotions } from "@/src/modules/home/components/HomePromotions";
import { HomeScreenSkeleton } from "@/src/modules/home/components/HomeScreenSkeleton";
import {
  HOME_PROMOTION_SHORTCUTS,
  HOME_PROMOTIONS,
} from "@/src/modules/home/data/home-promotions.data";
import { useHomeSummary } from "@/src/modules/home/hooks/useHomeSummary";
import { ContentSectionSurface } from "@/src/shared/components/ContentSectionSurface";
import { LiquidGlassSurface } from "@/src/shared/components/LiquidGlassSurface";

type HomeSection = "operations" | "products";

export function HomeScreen() {
  const { user } = useAuth();
  const { data, loading, error, reload } = useHomeSummary();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [section, setSection] = useState<HomeSection>("operations");
  const [ambientHeight, setAmbientHeight] = useState(900);
  const firstName = data?.firstName ?? user?.firstName ?? "Cliente";

  const navigateToTab = useCallback(
    (screen: keyof TabParamList) => {
      navigation.getParent<NavigationProp<TabParamList>>()?.navigate(screen);
    },
    [navigation],
  );

  const handleAction = useCallback(
    (code: string) => {
      if (code === "SERVICE_PAYMENT") navigateToTab("Payments");
      if (code === "CARD" || code === "ADD_PRODUCT") navigateToTab("Accounts");
      if (code === "QR_PAYMENT") navigateToTab("QrPayment");
    },
    [navigateToTab],
  );

  const handleContentLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const height = Math.ceil(event.nativeEvent.layout.y + insets.top + 48);
      setAmbientHeight((current) => (current === height ? current : height));
    },
    [insets.top],
  );

  return (
    <View className="flex-1 bg-[#F7FAF8]">
      <StatusBar style="light" />
      <View
        pointerEvents="none"
        className="absolute inset-x-0 top-0 overflow-hidden"
        style={{ height: ambientHeight }}
      >
        <HomeAmbientBackground />
      </View>
      <SafeAreaView className="flex-1" edges={["top"]}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          alwaysBounceVertical={false}
          overScrollMode="never"
          contentContainerStyle={{
            paddingBottom: Math.max(insets.bottom, 12) + 90,
          }}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={() => void reload()}
              tintColor="#FFFFFF"
            />
          }
        >
          <View className="self-center" style={{ width: Math.min(width, 390) }}>
            <HomeHeader firstName={firstName} />

            {loading && !data ? (
              <HomeScreenSkeleton />
            ) : error || !data ? (
              <LiquidGlassSurface className="mx-5 mt-8 rounded-3xl p-6">
                <Text className="text-lg font-bold text-green-950">
                  No pudimos cargar tu información
                </Text>
                <Text className="mt-2 text-sm text-green-950/60">
                  Comprueba la conexión con el backend e inténtalo nuevamente.
                </Text>
                <Pressable
                  onPress={() => void reload()}
                  className="mt-5 self-start rounded-full bg-green-700 px-5 py-3"
                >
                  <Text className="font-semibold text-white">
                    Volver a intentar
                  </Text>
                </Pressable>
              </LiquidGlassSurface>
            ) : (
              <>
                <BalanceSummaryCard
                  accounts={data.accounts}
                  balances={data.balances}
                  ownerName={firstName}
                />
                <HomePrimaryActions
                  onQrPress={() => navigateToTab("QrPayment")}
                  onPlinearPress={() => handleAction("PLINEAR")}
                />
                <View onLayout={handleContentLayout}>
                  <ContentSectionSurface>
                    <HomeContentSwitch
                      accounts={data.accounts}
                      quickActions={data.quickActions}
                      selected={section}
                      onChange={setSection}
                      onAction={handleAction}
                    />
                    <HomePromotions
                      items={HOME_PROMOTIONS}
                      onPromotionPress={() => navigateToTab("Profile")}
                      onShortcutPress={() => navigateToTab("Profile")}
                      shortcuts={HOME_PROMOTION_SHORTCUTS}
                    />
                  </ContentSectionSurface>
                </View>
              </>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
