import React, { useEffect, useState } from "react";
import { Animated, StyleProp, ViewStyle } from "react-native";

type Props = {
  width?: ViewStyle["width"];
  height?: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
};

export const Skeleton = ({
  width = "100%",
  height = 20,
  borderRadius = 8,
  style,
}: Props) => {
  const [opacity] = useState(() => new Animated.Value(0.3));

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
    );

    loop.start();

    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: "#E5E7EB",
          opacity,
        },
        style,
      ]}
    />
  );
};
