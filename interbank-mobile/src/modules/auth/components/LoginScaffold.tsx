import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { Menu } from "lucide-react-native";
import React from "react";
import type { PropsWithChildren } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { APP_CONFIG } from "@/src/config/app.config";
import { InterbankBrand } from "@/src/modules/auth/components/InterbankBrand";
import { LiquidGlassSurface } from "@/src/shared/components/LiquidGlassSurface";
import { BANKING_COLORS } from "@/src/shared/theme/banking.theme";

interface Props extends PropsWithChildren {
  onMenuPress: () => void;
  disabled?: boolean;
  reduceTransparency?: boolean;
}

export function LoginScaffold({
  children,
  onMenuPress,
  disabled,
  reduceTransparency,
}: Props) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const compact = width < 360 || height < 700;

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        style={styles.screen}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={styles.screen}
          contentContainerStyle={styles.content}
          bounces={false}
          alwaysBounceVertical={false}
          overScrollMode="never"
          contentInsetAdjustmentBehavior="never"
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          <LinearGradient
            colors={[BANKING_COLORS.green, BANKING_COLORS.greenBright]}
            style={[
              styles.hero,
              compact && styles.heroCompact,
              { paddingTop: insets.top + 18 },
            ]}
          >
            <View pointerEvents="none" style={styles.ambientRing} />
            <View pointerEvents="none" style={styles.ambientLight} />
            <View style={styles.header}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={onMenuPress}
                disabled={disabled}
                accessibilityRole="button"
                accessibilityLabel="Abrir menú de ayuda"
                accessibilityState={{ disabled: !!disabled }}
                style={styles.menu}
              >
                <LiquidGlassSurface
                  tone="neutral"
                  intensity={18}
                  opaque={reduceTransparency}
                  style={styles.menuSurface}
                >
                  <View style={styles.glassContent}>
                    <Menu
                      size={22}
                      color={reduceTransparency ? "#173A27" : "#FFFFFF"}
                      strokeWidth={1.8}
                    />
                  </View>
                </LiquidGlassSurface>
              </TouchableOpacity>
              <InterbankBrand variant="login" />
              <Text
                style={styles.version}
                accessibilityLabel={`Versión ${APP_CONFIG.VERSION}`}
              >
                v{APP_CONFIG.VERSION}
              </Text>
            </View>
            <View style={[styles.heading, compact && styles.headingCompact]}>
              <Text
                accessibilityRole="header"
                style={[styles.title, compact && styles.titleCompact]}
              >
                Todo lo que necesitas,{"\n"}en un solo App.
              </Text>
            </View>
          </LinearGradient>
          <View
            style={[
              styles.body,
              { paddingBottom: Math.max(insets.bottom, 20) + 16 },
            ]}
          >
            <View style={styles.form}>{children}</View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  heroCompact: { paddingBottom: 40 },
  headingCompact: { paddingTop: 24 },
  titleCompact: { fontSize: 26, lineHeight: 32 },
  glassContent: { zIndex: 1 },
  screen: { flex: 1, backgroundColor: BANKING_COLORS.green },
  content: { flexGrow: 1 },
  hero: { paddingHorizontal: 24, paddingBottom: 52, overflow: "hidden" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    width: "100%",
    maxWidth: 460,
    alignSelf: "center",
  },
  menu: { borderRadius: 22 },
  menuSurface: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  version: { color: "rgba(255,255,255,0.8)", fontSize: 11 },
  heading: { alignItems: "center", paddingTop: 36 },
  title: {
    color: "#FFFFFF",
    fontSize: 30,
    fontWeight: "600",
    letterSpacing: -0.8,
    lineHeight: 36,
    textAlign: "center",
  },
  ambientRing: {
    position: "absolute",
    width: 320,
    height: 320,
    borderRadius: 160,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    right: -180,
    top: 60,
  },
  ambientLight: {
    position: "absolute",
    width: 210,
    height: 210,
    borderRadius: 105,
    backgroundColor: "rgba(255,255,255,0.035)",
    left: -130,
    top: -100,
  },
  body: {
    flex: 1,
    marginTop: -28,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    backgroundColor: "#F7FAF8",
    paddingTop: 26,
    paddingHorizontal: 24,
  },
  form: { flex: 1, width: "100%", maxWidth: 420, alignSelf: "center" },
});
