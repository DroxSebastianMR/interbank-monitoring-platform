import { useEffect } from "react";
import {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

const ANIMATION_DURATION = 2000;

export const useWaveAnimation = () => {
  const scale = useSharedValue(0.5);
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    scale.set(
      withRepeat(
        withTiming(3, {
          duration: ANIMATION_DURATION,
          easing: Easing.out(Easing.exp),
        }),
        -1,
        false,
      ),
    );

    opacity.set(
      withRepeat(
        withTiming(0, {
          duration: ANIMATION_DURATION,
        }),
        -1,
        false,
      ),
    );
  }, [opacity, scale]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.get() }],
    opacity: opacity.get(),
  }));

  return style;
};
