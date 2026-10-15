import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import type { PropsWithChildren } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { StyleSheet, View } from "react-native";

interface LiquidGlassSurfaceProps extends PropsWithChildren {
  className?: string;
  intensity?: number;
  tone?: "adaptive" | "green" | "blue" | "neutral";
  style?: StyleProp<ViewStyle>;
  opaque?: boolean;
}

const GLASS_TONES = {
  adaptive: {
    ambient: "rgba(112,239,169,0.13)",
    depth: "rgba(20,124,78,0.07)",
  },
  green: {
    ambient: "rgba(83,229,147,0.16)",
    depth: "rgba(0,126,63,0.08)",
  },
  blue: {
    ambient: "rgba(117,190,255,0.16)",
    depth: "rgba(18,98,184,0.07)",
  },
  neutral: {
    ambient: "rgba(255,255,255,0.14)",
    depth: "rgba(61,92,74,0.05)",
  },
} as const;

export function LiquidGlassSurface({
  children,
  className,
  intensity = 30,
  tone = "adaptive",
  style,
  opaque = false,
}: LiquidGlassSurfaceProps) {
  const palette = GLASS_TONES[tone];

  return (
    <View className={`overflow-hidden ${className ?? ""}`} style={style}>
      {opaque ? (
        <View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, { backgroundColor: "#E7F0EB" }]}
        />
      ) : (
        <BlurView
          pointerEvents="none"
          intensity={intensity}
          tint="light"
          blurMethod="dimezisBlurView"
          style={StyleSheet.absoluteFill}
        />
      )}
      <View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          styles.tint,
          { backgroundColor: palette.ambient },
        ]}
      />
      <LinearGradient
        pointerEvents="none"
        colors={[
          "rgba(255,255,255,0.32)",
          "rgba(255,255,255,0.05)",
          palette.depth,
        ]}
        locations={[0, 0.46, 1]}
        start={{ x: 0.08, y: 0.05 }}
        end={{ x: 0.94, y: 0.95 }}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        pointerEvents="none"
        colors={[
          "rgba(255,255,255,0)",
          "rgba(255,255,255,0.22)",
          "rgba(255,255,255,0)",
        ]}
        locations={[0.18, 0.52, 0.82]}
        start={{ x: 0, y: 1 }}
        end={{ x: 1, y: 0 }}
        style={StyleSheet.absoluteFill}
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  tint: {
    borderColor: "rgba(255,255,255,0.58)",
    borderWidth: 1,
  },
});
