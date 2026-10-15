import React from "react";
import { StyleSheet, Text, View } from "react-native";

export function InterbankBrand({
  variant = "default",
  size = "regular",
}: {
  variant?: "default" | "login";
  size?: "regular" | "compact";
}) {
  if (variant === "login") {
    return (
      <View style={styles.brand} accessible accessibilityLabel="Interbank">
        <View style={styles.mark}>
          <View style={styles.cutout} />
        </View>
        <Text
          style={[
            styles.wordmark,
            size === "compact" && styles.compactWordmark,
          ]}
        >
          Interbank
        </Text>
      </View>
    );
  }
  return (
    <View
      className="flex-row items-center"
      accessibilityLabel="Interbank Monitor"
    >
      <View className="mr-3 h-9 w-9 rotate-45 items-center justify-center rounded-[10px] bg-white">
        <View className="h-3.5 w-3.5 rounded-[4px] bg-[#ffb81c]" />
      </View>
      <View>
        <Text className="text-[26px] font-black tracking-[-1px] text-white">
          interbank
        </Text>
        <Text className="mt-[-4px] text-[10px] font-semibold uppercase tracking-[2px] text-white/80">
          monitor
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  compactWordmark: { fontSize: 20 },
  brand: { flexDirection: "row", alignItems: "center", gap: 7 },
  mark: {
    width: 23,
    height: 27,
    borderColor: "#0755C9",
    borderWidth: 6,
    borderRadius: 2,
    transform: [{ skewY: "-10deg" }],
    alignItems: "center",
    justifyContent: "center",
  },
  cutout: { width: 11, height: 15 },
  wordmark: {
    color: "#FFFFFF",
    fontSize: 26,
    fontWeight: "600",
    letterSpacing: -1.1,
  },
});
