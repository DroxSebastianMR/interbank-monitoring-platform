import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import React from "react";
import type { PropsWithChildren } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { InterbankBrand } from "@/src/modules/auth/components/InterbankBrand";
import { BANKING_COLORS } from "@/src/shared/theme/banking.theme";

export function LoginScaffold({ children }: PropsWithChildren) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const compact = width < 375 || height < 740;
  const narrow = width < 350;

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
              {
                paddingTop: insets.top + (compact ? 12 : 18),
                paddingHorizontal: narrow ? 16 : 24,
              },
            ]}
          >
            <View pointerEvents="none" style={styles.ambientRing} />
            <View pointerEvents="none" style={styles.ambientLight} />
            <View style={styles.header}>
              <InterbankBrand
                variant="login"
                size={narrow ? "compact" : "regular"}
              />
            </View>
            <View style={[styles.heading, compact && styles.headingCompact]}>
              <Text
                accessibilityRole="header"
                style={[
                  styles.title,
                  compact && styles.titleCompact,
                  narrow && styles.titleNarrow,
                ]}
              >
                Todo lo que necesitas,{"\n"}en un solo App.
              </Text>
            </View>
          </LinearGradient>
          <View
            style={[
              styles.body,
              {
                paddingBottom: Math.max(insets.bottom, 20) + 16,
                paddingHorizontal: narrow ? 16 : 24,
              },
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
  heroCompact: { paddingBottom: 42 },
  headingCompact: { paddingTop: 24 },
  titleCompact: { fontSize: 26, lineHeight: 32 },
  titleNarrow: { fontSize: 23, lineHeight: 29 },
  screen: { flex: 1, backgroundColor: "#F7FAF8" },
  content: { flexGrow: 1 },
  hero: { paddingHorizontal: 24, paddingBottom: 52, overflow: "hidden" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
    width: "100%",
    maxWidth: 460,
    alignSelf: "center",
  },
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
