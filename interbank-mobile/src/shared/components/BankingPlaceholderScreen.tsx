import type { LucideIcon } from "lucide-react-native";
import React from "react";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface Props {
  title: string;
  description: string;
  icon: LucideIcon;
}

export function BankingPlaceholderScreen({
  title,
  description,
  icon: Icon,
}: Props) {
  return (
    <SafeAreaView className="flex-1 bg-background px-6" edges={["top"]}>
      <View className="flex-1 items-center justify-center pb-24">
        <View className="h-20 w-20 items-center justify-center rounded-3xl bg-white shadow-sm">
          <Icon color="#009B3A" size={34} />
        </View>
        <Text className="mt-6 text-2xl font-bold text-textPrimary">
          {title}
        </Text>
        <Text className="mt-3 max-w-sm text-center leading-6 text-textSecondary">
          {description}
        </Text>
      </View>
    </SafeAreaView>
  );
}
