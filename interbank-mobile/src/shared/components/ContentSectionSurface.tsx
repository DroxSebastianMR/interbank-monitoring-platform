import React from "react";
import type { PropsWithChildren } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { StyleSheet, View } from "react-native";

import { BANKING_COLORS } from "@/src/shared/theme/banking.theme";

interface ContentSectionSurfaceProps extends PropsWithChildren {
  style?: StyleProp<ViewStyle>;
}

export function ContentSectionSurface({
  children,
  style,
}: ContentSectionSurfaceProps) {
  return (
    <View style={[styles.surface, style]}>
      <View pointerEvents="none" style={styles.topEdge} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  surface: {
    backgroundColor: BANKING_COLORS.surface,
    borderColor: BANKING_COLORS.surfaceBorder,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderTopWidth: 1,
    elevation: 5,
    marginTop: 24,
    paddingBottom: 32,
    paddingTop: 20,
    shadowColor: BANKING_COLORS.greenDeep,
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
  },
  topEdge: {
    alignSelf: "center",
    backgroundColor: BANKING_COLORS.surfaceElevated,
    borderRadius: 999,
    height: 3,
    opacity: 0.9,
    position: "absolute",
    top: 7,
    width: 40,
  },
});
