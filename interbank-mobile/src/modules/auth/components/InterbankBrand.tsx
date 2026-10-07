import React from "react";
import { Text, View } from "react-native";

export function InterbankBrand() {
  return (
    <View className="flex-row items-center" accessibilityLabel="Interbank Monitor">
      <View className="mr-3 h-9 w-9 rotate-45 items-center justify-center rounded-[10px] bg-white">
        <View className="h-3.5 w-3.5 rounded-[4px] bg-[#ffb81c]" />
      </View>
      <View>
        <Text className="text-[26px] font-black tracking-[-1px] text-white">interbank</Text>
        <Text className="mt-[-4px] text-[10px] font-semibold uppercase tracking-[2px] text-white/80">
          monitor
        </Text>
      </View>
    </View>
  );
}
