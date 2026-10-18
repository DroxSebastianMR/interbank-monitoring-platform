import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet, View } from "react-native";

import { HOME_COLORS } from "@/src/modules/home/theme/home.theme";

export function HomeAmbientBackground() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <LinearGradient
        colors={[HOME_COLORS.green, HOME_COLORS.greenBright, HOME_COLORS.mist]}
        locations={[0, 0.38, 0.76]}
        style={StyleSheet.absoluteFill}
      />
      <View className="absolute -right-16 -top-10 h-64 w-64 rounded-full bg-lime-200/30" />
      <View className="absolute -left-24 top-72 h-64 w-64 rounded-full bg-blue-400/25" />
      <View className="absolute -right-20 top-[520px] h-64 w-64 rounded-full bg-emerald-200/35" />
    </View>
  );
}
