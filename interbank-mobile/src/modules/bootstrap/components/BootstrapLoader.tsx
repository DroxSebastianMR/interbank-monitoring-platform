import React, { useEffect } from "react";

import { ActivityIndicator, Text, View } from "react-native";

import Animated, { FadeOut } from "react-native-reanimated";

import { useHapticsLoop } from "@/src/modules/bootstrap/hooks/useHapticsLoop";

import { useWaveAnimation } from "@/src/modules/bootstrap/hooks/useWaveAnimation";

type Props = {
  completed?: boolean;

  onFinish?: () => void;
};

export const BootstrapLoader = ({ completed, onFinish }: Props) => {
  const waveStyle = useWaveAnimation();

  useHapticsLoop();
  useEffect(() => {
    if (!completed) return;

    const timeout = setTimeout(() => {
      onFinish?.();
    }, 1000);

    return () => clearTimeout(timeout);
  }, [completed, onFinish]);

  return (
    <Animated.View
      exiting={FadeOut.duration(700)}
      className="flex-1 bg-primary items-center justify-center px-6"
    >
      <Animated.View
        className="absolute w-[300px] h-[300px] rounded-full bg-surface"
        style={waveStyle}
      />

      <View className="h-28 w-28 items-center justify-center rounded-[32px] bg-white shadow-xl">
        <Text className="text-4xl font-black text-primary">IB</Text>
      </View>
      <ActivityIndicator className="mt-8" color="#FFFFFF" size="small" />

      <View className="absolute bottom-8">
        <Text className="text-textPrimary text-xs opacity-50 tracking-wide">
          © {new Date().getFullYear()} Interbank Monitor · Entorno académico
        </Text>
      </View>
    </Animated.View>
  );
};
