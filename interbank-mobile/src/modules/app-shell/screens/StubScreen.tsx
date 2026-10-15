import React from "react";
import { Pressable, Text, View } from "react-native";

type Props = {
  title: string;
  message?: string;
  onRetry?: () => void;
  showRetry?: boolean;
  actionLabel?: string;
  onAction?: () => void;
};

export const StubScreen = ({
  title,
  message,
  onRetry,
  showRetry,
  actionLabel,
  onAction,
}: Props) => {
  return (
    <View className="flex-1 bg-primary items-center justify-center px-6">
      <View className="w-full max-w-md bg-surface rounded-3xl p-8 shadow-lg items-center">
        <Text className="text-2xl font-bold text-textPrimary mb-2">
          Interbank Monitor
        </Text>
        <Text className="text-lg font-semibold text-textSecondary mb-2">
          {title}
        </Text>

        {/* MESSAGE */}
        {message && (
          <Text className="text-textSecondary text-center mb-8">{message}</Text>
        )}
        <View className="w-full">
          {showRetry && (
            <Pressable
              onPress={onRetry}
              className="bg-black py-3 rounded-xl mb-3 items-center"
            >
              <Text className="text-white font-semibold">Reintentar</Text>
            </Pressable>
          )}

          {actionLabel && onAction && (
            <Pressable
              onPress={onAction}
              className="bg-primary py-3 rounded-xl items-center border border-primary active:bg-primaryDark"
            >
              <Text className="text-black font-semibold">{actionLabel}</Text>
            </Pressable>
          )}
        </View>
      </View>
      <Text className="text-white text-xs mt-6 opacity-80">
        © {new Date().getFullYear()} Interbank Monitor
      </Text>
    </View>
  );
};
