import * as Haptics from "expo-haptics";
import { useEffect } from "react";

const DELAYS = { heavy: 80, medium: 120, light: 200, pause: 400 } as const;
const sleep = (milliseconds: number) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

export function useHapticsLoop(): void {
  useEffect(() => {
    let active = true;

    const run = async (): Promise<void> => {
      while (active) {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        await sleep(DELAYS.heavy);
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        await sleep(DELAYS.medium);
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        await sleep(DELAYS.light + DELAYS.pause);
      }
    };

    void run();
    return () => {
      active = false;
    };
  }, []);
}
