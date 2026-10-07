import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { LockKeyhole, Menu } from "lucide-react-native";
import React from "react";
import type { PropsWithChildren, ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { InterbankBrand } from "@/src/modules/auth/components/InterbankBrand";
import { LiquidGlassSurface } from "@/src/shared/components/LiquidGlassSurface";
import { BANKING_COLORS } from "@/src/shared/theme/banking.theme";

interface Props extends PropsWithChildren {
  firstName?: string;
  onMenuPress: () => void;
  onLockPress: () => void;
  quickAccess: ReactNode;
  disabled: boolean;
  reduceTransparency: boolean;
}

export function DeviceLoginScaffold({
  children,
  firstName,
  onMenuPress,
  onLockPress,
  quickAccess,
  disabled,
  reduceTransparency,
}: Props) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const compact = height < 750;
  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        style={styles.screen}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          <LinearGradient
            colors={[BANKING_COLORS.green, BANKING_COLORS.greenBright]}
            style={[styles.hero, { paddingTop: insets.top + 16 }]}
          >
            <View pointerEvents="none" style={styles.ambient} />
            <View style={styles.header}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={onMenuPress}
                disabled={disabled}
                accessibilityRole="button"
                accessibilityLabel="Abrir menú de ayuda"
                style={styles.menu}
              >
                <LiquidGlassSurface
                  intensity={18}
                  tone="neutral"
                  opaque={reduceTransparency}
                  style={styles.menuSurface}
                >
                  <View style={styles.foreground}>
                    <Menu
                      size={21}
                      color={
                        reduceTransparency ? BANKING_COLORS.ink : "#FFFFFF"
                      }
                    />
                  </View>
                </LiquidGlassSurface>
              </TouchableOpacity>
              <View style={styles.brand}>
                <InterbankBrand
                  variant="login"
                  size={width < 390 ? "compact" : "regular"}
                />
              </View>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={onLockPress}
                disabled={disabled}
                accessibilityRole="button"
                accessibilityLabel="Bloquear acceso en este dispositivo"
                style={styles.lock}
              >
                <LockKeyhole size={15} color="#FFFFFF" />
                <Text style={styles.lockText}>Bloquear</Text>
              </TouchableOpacity>
            </View>
            <Text
              accessibilityRole="header"
              style={[styles.greeting, compact && styles.greetingCompact]}
            >
              Hola,{" "}
              <Text style={styles.name}>{firstName?.trim() || "Cliente"}</Text>
            </Text>
            <View style={styles.quickAccess}>{quickAccess}</View>
          </LinearGradient>
          <View
            style={[
              styles.body,
              { paddingBottom: Math.max(insets.bottom, 20) + 12 },
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
  screen: { flex: 1, backgroundColor: BANKING_COLORS.surface },
  scroll: { flexGrow: 1 },
  hero: { paddingHorizontal: 20, paddingBottom: 50, overflow: "hidden" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    width: "100%",
    maxWidth: 460,
    alignSelf: "center",
  },
  menu: { borderRadius: 20 },
  menuSurface: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  foreground: { zIndex: 1 },
  brand: { flex: 1, minWidth: 0 },
  lock: {
    minHeight: 40,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.85)",
    paddingHorizontal: 11,
    borderRadius: 22,
  },
  lockText: { fontSize: 13, fontWeight: "600", color: "#FFFFFF" },
  greeting: {
    color: "#FFFFFF",
    fontSize: 29,
    textAlign: "center",
    marginTop: 30,
    marginBottom: 24,
    fontWeight: "400",
    letterSpacing: -0.6,
  },
  greetingCompact: { marginTop: 22, marginBottom: 18, fontSize: 26 },
  name: { fontWeight: "600" },
  quickAccess: { width: "100%", maxWidth: 420, alignSelf: "center" },
  ambient: {
    position: "absolute",
    top: -80,
    right: -100,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "rgba(190,243,112,0.17)",
  },
  body: {
    flex: 1,
    marginTop: -28,
    paddingTop: 26,
    paddingHorizontal: 24,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    backgroundColor: BANKING_COLORS.surface,
  },
  form: { flex: 1, width: "100%", maxWidth: 420, alignSelf: "center" },
});
