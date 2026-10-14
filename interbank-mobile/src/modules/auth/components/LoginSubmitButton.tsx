import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { BANKING_COLORS } from "@/src/shared/theme/banking.theme";

interface Props {
  onPress: () => void;
  disabled: boolean;
  loading: boolean;
  reduceTransparency: boolean;
  title?: string;
  icon?: React.ReactNode;
}

export function LoginSubmitButton({
  onPress,
  disabled,
  loading,
  reduceTransparency,
  title = "Ingresar",
  icon,
}: Props) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled, busy: loading }}
      style={[styles.button, loading && styles.loading]}
    >
      <View style={[styles.surface, !reduceTransparency && styles.glassEdge]}>
        {!reduceTransparency ? (
          <>
            <LinearGradient
              pointerEvents="none"
              colors={[
                "rgba(255,255,255,0.28)",
                "rgba(255,255,255,0.04)",
                "rgba(13,47,135,0.12)",
              ]}
              locations={[0, 0.46, 1]}
              start={{ x: 0.15, y: 0 }}
              end={{ x: 0.85, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <LinearGradient
              pointerEvents="none"
              colors={[
                "rgba(255,255,255,0)",
                "rgba(255,255,255,0.16)",
                "rgba(255,255,255,0)",
              ]}
              locations={[0.15, 0.48, 0.8]}
              start={{ x: 0, y: 1 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
            <View pointerEvents="none" style={styles.innerRim} />
          </>
        ) : null}
        <View style={styles.content}>
          {loading ? <ActivityIndicator color="#FFFFFF" size="small" /> : icon}
          <Text style={styles.title}>
            {loading ? "Verificando acceso…" : title}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: "100%",
    marginTop: 4,
    borderRadius: 16,
    backgroundColor: BANKING_COLORS.blueAction,
    boxShadow: "0 6px 16px rgba(37,99,235,0.22)",
  },
  surface: {
    minHeight: 56,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "transparent",
    paddingHorizontal: 20,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  glassEdge: {
    borderColor: "rgba(255,255,255,0.36)",
    borderTopColor: "rgba(255,255,255,0.62)",
    borderBottomColor: "rgba(255,255,255,0.2)",
  },
  innerRim: {
    position: "absolute",
    top: 1,
    left: 1,
    right: 1,
    bottom: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderTopColor: "rgba(255,255,255,0.2)",
  },
  content: {
    zIndex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "600",
    flexShrink: 1,
    textAlign: "center",
  },
  loading: { opacity: 0.8 },
});
