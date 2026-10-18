import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { ArrowLeft } from "lucide-react-native";
import React from "react";
import type { PropsWithChildren, ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LiquidGlassSurface } from "./LiquidGlassSurface";
import { BANKING_COLORS as C } from "@/src/shared/theme/banking.theme";

interface Props extends PropsWithChildren {
  title: string;
  onBack: () => void;
  footer?: ReactNode;
  opaque?: boolean;
  variant?: "green" | "light";
  headerTopSpacing?: number;
  headerContentOffset?: number;
}

export function BankingFlowScreen({
  title,
  onBack,
  footer,
  children,
  opaque = false,
  variant = "green",
  headerTopSpacing = 12,
  headerContentOffset = 0,
}: Props) {
  const insets = useSafeAreaInsets();
  const green = variant === "green";
  return (
    <View style={styles.screen}>
      <StatusBar style={green ? "light" : "dark"} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          bounces={false}
          overScrollMode="never"
          alwaysBounceVertical={false}
          contentInsetAdjustmentBehavior="never"
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
        >
          <View
            style={[
              styles.header,
              green && styles.greenHeader,
              { paddingTop: insets.top + headerTopSpacing },
            ]}
          >
            {green ? (
              <LinearGradient
                pointerEvents="none"
                colors={[C.green, "#08B94C"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
            ) : null}
            <View style={[styles.container, styles.headerRow, { transform: [{ translateY: headerContentOffset }] }]}>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Volver"
                onPress={onBack}
                activeOpacity={0.8}
                style={styles.back}
              >
                {green ? (
                  <LiquidGlassSurface
                    tone="neutral"
                    intensity={12}
                    opaque={opaque}
                    style={styles.back}
                  >
                    <View style={styles.foreground}>
                      <ArrowLeft
                        size={22}
                        color={opaque ? C.greenDeep : "#FFFFFF"}
                      />
                    </View>
                  </LiquidGlassSurface>
                ) : (
                  <ArrowLeft size={23} color={C.green} />
                )}
              </TouchableOpacity>
              <Text
                accessibilityRole="header"
                style={[styles.title, green && styles.whiteTitle]}
              >
                {title}
              </Text>
              <View style={styles.spacer} />
            </View>
          </View>
          <View
            style={[
              styles.container,
              styles.content,
              { paddingBottom: footer ? 28 : Math.max(insets.bottom, 20) + 24 },
            ]}
          >
            {children}
          </View>
        </ScrollView>
        {footer ? (
          <View
            style={[
              styles.footer,
              { paddingBottom: Math.max(insets.bottom, 16) },
            ]}
          >
            <View style={styles.container}>{footer}</View>
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#FFFFFF" },
  flex: { flex: 1 },
  scroll: { flexGrow: 1 },
  container: { width: "100%", maxWidth: 500, alignSelf: "center" },
  header: {
    paddingHorizontal: 18,
    paddingBottom: 14,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
    borderBottomWidth: 1,
    borderBottomColor: "#EDF2EE",
  },
  greenHeader: {
    paddingBottom: 24,
    borderBottomLeftRadius: 34,
    borderBottomRightRadius: 34,
    borderBottomWidth: 0,
    backgroundColor: C.green,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 52,
  },
  back: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  foreground: { zIndex: 1 },
  title: {
    color: C.ink,
    fontSize: 20,
    fontWeight: "600",
    letterSpacing: -0.5,
    flex: 1,
    textAlign: "center",
  },
  whiteTitle: { color: "#FFFFFF", fontSize: 25, textAlign: "left" },
  spacer: { width: 12 },
  content: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 25 },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#F0F3F1",
    backgroundColor: "#FFFFFF",
  },
});
