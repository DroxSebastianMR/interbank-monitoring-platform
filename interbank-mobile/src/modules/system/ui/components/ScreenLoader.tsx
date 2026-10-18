import React from "react";
import { ActivityIndicator, View } from "react-native";

type Props = {
  visible: boolean;
};

export const ScreenLoader = ({ visible }: Props) => {
  if (!visible) return null;

  return (
    <View className="absolute inset-0 bg-black/40 justify-center items-center z-50">
      <ActivityIndicator size="large" color="#ffffff" />
    </View>
  );
};
