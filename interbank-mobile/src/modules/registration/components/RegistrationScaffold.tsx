import { StatusBar } from "expo-status-bar";
import { ArrowLeft } from "lucide-react-native";
import React, { useEffect, useRef } from "react";
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
import { LiquidGlassSurface } from "@/src/shared/components/LiquidGlassSurface";
import { RegistrationProgress } from "./RegistrationProgress";
import { BANKING_COLORS as C } from "@/src/shared/theme/banking.theme";

interface Props extends PropsWithChildren {
  stepKey: string;
  title: string;
  index: number;
  total: number;
  complete: boolean;
  opaque: boolean;
  onBack: () => void;
  footer: ReactNode;
}

export function RegistrationScaffold({
  stepKey,
  title,
  index,
  total,
  complete,
  opaque,
  onBack,
  footer,
  children,
}: Props) {
  const insets = useSafeAreaInsets();
  const scroll = useRef<ScrollView>(null);
  useEffect(() => {
    scroll.current?.scrollTo({ y: 0, animated: false });
  }, [stepKey]);
  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={[styles.header, { paddingTop: insets.top + 15 }]}>
          <View style={[styles.container, styles.headerRow]}>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={
                index === 0 || complete
                  ? "Volver al ingreso"
                  : "Volver al paso anterior"
              }
              onPress={onBack}
              activeOpacity={0.8}
            >
              <LiquidGlassSurface
                tone="neutral"
                intensity={10}
                opaque={opaque}
                style={styles.back}
              >
                <View style={styles.foreground}>
                  <ArrowLeft size={22} color={C.green} />
                </View>
              </LiquidGlassSurface>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Crear usuario</Text>
            <View style={styles.headerSpacer} />
          </View>
        </View>
        <ScrollView
          ref={scroll}
          bounces={false}
          alwaysBounceVertical={false}
          overScrollMode="never"
          contentInsetAdjustmentBehavior="never"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerStyle={styles.scroll}
        >
          <View style={[styles.container, styles.body]}>
            {!complete ? (
              <RegistrationProgress index={index} total={total} />
            ) : null}
            <Text accessibilityRole="header" style={styles.title}>
              {title}
            </Text>
            <View style={styles.fields}>{children}</View>
          </View>
          <View
            style={[
              styles.container,
              styles.bottom,
              { paddingBottom: Math.max(insets.bottom, 16) + 4 },
            ]}
          >
            {footer}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#FFFFFF" },
  flex: { flex: 1 },
  container: { width: "100%", maxWidth: 480, alignSelf: "center" },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: "#ECF1ED",
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: "#FFFFFF",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 48,
  },
  back: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F6FAF7",
  },
  foreground: { zIndex: 1 },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 16,
    color: C.ink,
    fontWeight: "500",
  },
  headerSpacer: { width: 44 },
  scroll: { flexGrow: 1 },
  body: { paddingTop: 24, paddingHorizontal: 24 },
  title: {
    color: C.ink,
    fontSize: 27,
    lineHeight: 34,
    textAlign: "center",
    fontWeight: "500",
    letterSpacing: -0.7,
  },
  fields: { marginTop: 29 },
  bottom: { marginTop: "auto", paddingTop: 32, paddingHorizontal: 24 },
});
