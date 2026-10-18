import React from "react";
import { StyleSheet, View } from "react-native";
import { BANKING_COLORS as C } from "@/src/shared/theme/banking.theme";

export function RegistrationProgress({
  index,
  total,
}: {
  index: number;
  total: number;
}) {
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel="Progreso del registro"
      accessibilityValue={{
        min: 1,
        max: total,
        now: index + 1,
        text: `Paso ${index + 1} de ${total}`,
      }}
      style={styles.progress}
    >
      {Array.from({ length: total }, (_, item) => (
        <View
          key={item}
          style={[styles.segment, item <= index && styles.active]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  progress: {
    width: "74%",
    maxWidth: 260,
    alignSelf: "center",
    flexDirection: "row",
    gap: 5,
    marginTop: 10,
    marginBottom: 28,
  },
  segment: { flex: 1, height: 4, borderRadius: 3, backgroundColor: "#E8EEEA" },
  active: { backgroundColor: C.green },
});
