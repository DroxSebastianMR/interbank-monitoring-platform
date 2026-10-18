import React from "react";
import { Pressable, Text } from "react-native";

type Props = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary";
};

export const AuthButton = ({
  title,
  onPress,
  disabled = false,
  variant = "primary",
}: Props) => {
  const secondary = variant === "secondary";

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      className={`min-h-[54px] items-center justify-center rounded-2xl px-5 ${
        disabled
          ? "bg-[#d6ddd9]"
          : secondary
            ? "border border-[#009b3a] bg-white active:bg-[#ecf8f0]"
            : "bg-[#009b3a] active:bg-[#007c2e]"
      }`}
    >
      <Text
        className={`text-[16px] font-bold ${
          disabled
            ? "text-[#87928c]"
            : secondary
              ? "text-[#007c2e]"
              : "text-white"
        }`}
      >
        {title}
      </Text>
    </Pressable>
  );
};
