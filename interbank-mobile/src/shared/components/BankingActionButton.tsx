import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
} from "react-native";
import { BANKING_COLORS as C } from "@/src/shared/theme/banking.theme";

export function BankingActionButton({
  title,
  loadingTitle = "Consultando…",
  loading = false,
  disabled = false,
  opaque = false,
  onPress,
}: {
  title: string;
  loadingTitle?: string;
  loading?: boolean;
  disabled?: boolean;
  opaque?: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      disabled={disabled || loading}
      activeOpacity={0.85}
      onPress={onPress}
      style={[styles.button, disabled && styles.disabled]}
    >
      {!opaque && !disabled ? (
        <LinearGradient
          pointerEvents="none"
          colors={[
            "rgba(255,255,255,0.18)",
            "rgba(255,255,255,0.01)",
            "rgba(10,37,110,0.09)",
          ]}
          style={StyleSheet.absoluteFill}
        />
      ) : null}
      {loading ? <ActivityIndicator color="#FFFFFF" /> : null}
      <Text style={[styles.title, disabled && styles.disabledTitle]}>
        {loading ? loadingTitle : title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: C.blueAction,
    minHeight: 55,
    borderRadius: 27,
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    textAlign: "center",
    flexShrink: 1,
  },
  disabled: { backgroundColor: "#E9EEEB", borderColor: "#E9EEEB" },
  disabledTitle: { color: "#9AA69F" },
});
