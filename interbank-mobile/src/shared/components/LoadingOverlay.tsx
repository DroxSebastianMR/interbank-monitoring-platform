import React from "react";
import { ActivityIndicator, View } from "react-native";

type Props = {
  visible: boolean;
};

export const LoadingOverlay = ({ visible }: Props) => {
  if (!visible) return null;

  return (
    <View
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.35)",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 999,
      }}
    >
      <View
        style={{
          padding: 18,
          borderRadius: 16,
          backgroundColor: "rgba(0,0,0,0.6)",
        }}
      >
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    </View>
  );
};
