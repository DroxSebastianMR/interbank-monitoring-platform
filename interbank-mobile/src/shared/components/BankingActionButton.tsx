import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet, Text, TouchableOpacity } from "react-native";
import { BANKING_COLORS as C } from "@/src/shared/theme/banking.theme";

export function BankingActionButton({
  title,
  disabled = false,
  opaque = false,
  onPress,
}: {
  title: string;
  disabled?: boolean;
  opaque?: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      activeOpacity={0.85}
      onPress={onPress}
      style={[styles.button, disabled && styles.disabled]}
    >
      {!disabled && !opaque ? (
        <LinearGradient
          pointerEvents="none"
          colors={[
            "rgba(255,255,255,0.2)",
            "rgba(255,255,255,0.02)",
            "rgba(12,43,112,0.1)",
          ]}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      ) : null}
      <Text style={[styles.title, disabled && styles.disabledTitle]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 54,
    borderRadius: 26,
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: C.blueAction,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  disabled: { backgroundColor: "#EBEFED", borderColor: "#EBEFED" },
  disabledTitle: { color: "#A5AFA9" },
});
