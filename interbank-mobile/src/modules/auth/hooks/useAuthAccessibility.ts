import { useEffect, useState } from "react";
import { AccessibilityInfo, Platform } from "react-native";

export function useAuthAccessibility() {
  const [reduceTransparency, setReduceTransparency] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    if (Platform.OS === "web") {
      if (typeof globalThis.matchMedia !== "function") return;
      const transparency = globalThis.matchMedia(
        "(prefers-reduced-transparency: reduce)",
      );
      const motion = globalThis.matchMedia("(prefers-reduced-motion: reduce)");
      const updateTransparency = () =>
        setReduceTransparency(transparency.matches);
      const updateMotion = () => setReduceMotion(motion.matches);
      updateTransparency();
      updateMotion();
      transparency.addEventListener("change", updateTransparency);
      motion.addEventListener("change", updateMotion);
      return () => {
        transparency.removeEventListener("change", updateTransparency);
        motion.removeEventListener("change", updateMotion);
      };
    }
    let active = true;
    void AccessibilityInfo.isReduceTransparencyEnabled()
      .then((value) => {
        if (active) setReduceTransparency(value);
      })
      .catch(() => {});
    void AccessibilityInfo.isReduceMotionEnabled()
      .then((value) => {
        if (active) setReduceMotion(value);
      })
      .catch(() => {});
    const transparency = AccessibilityInfo.addEventListener(
      "reduceTransparencyChanged",
      setReduceTransparency,
    );
    const motion = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReduceMotion,
    );
    return () => {
      active = false;
      transparency.remove();
      motion.remove();
    };
  }, []);

  return { reduceTransparency, reduceMotion };
}
