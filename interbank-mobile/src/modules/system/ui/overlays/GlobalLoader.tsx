import { ActivityIndicator, View } from "react-native";

export const GlobalLoader = () => {
  return (
    <View className="absolute inset-0 z-50 items-center justify-center bg-black/40">
      <ActivityIndicator size="large" />
    </View>
  );
};
