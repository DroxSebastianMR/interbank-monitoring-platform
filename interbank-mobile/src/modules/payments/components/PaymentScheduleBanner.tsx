import { LinearGradient } from "expo-linear-gradient";
import { ChevronRight, X } from "lucide-react-native";
import React, { useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BANKING_COLORS as C } from "@/src/shared/theme/banking.theme";

export function PaymentScheduleBanner({
  opaque,
  reduceMotion,
}: {
  opaque: boolean;
  reduceMotion: boolean;
}) {
  const [visible, setVisible] = useState(false);
  const insets = useSafeAreaInsets();
  return (
    <>
      <TouchableOpacity
        activeOpacity={0.9}
        accessibilityRole="button"
        accessibilityLabel="Programa tus pagos. Conoce esta opción"
        onPress={() => setVisible(true)}
        style={styles.banner}
      >
        {!opaque ? (
          <LinearGradient
            pointerEvents="none"
            colors={[
              "rgba(255,255,255,0.13)",
              "rgba(255,255,255,0.01)",
              "rgba(255,255,255,0.06)",
            ]}
            locations={[0, 0.55, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        ) : null}
        <View style={styles.calendar} accessible={false}>
          <View style={styles.backPage} />
          <View style={styles.page}>
            <View style={styles.calendarTop} />
            <View style={styles.calendarDays}>
              {Array.from({ length: 9 }, (_, index) => (
                <View
                  key={index}
                  style={[styles.day, index === 4 && styles.selectedDay]}
                />
              ))}
            </View>
          </View>
          <View style={[styles.ring, styles.leftRing]} />
          <View style={[styles.ring, styles.rightRing]} />
        </View>
        <View style={styles.copy}>
          <Text style={styles.title}>Programa tus pagos</Text>
          <Text style={styles.subtitle}>Ten tus fechas a la mano</Text>
        </View>
        <ChevronRight color="#FFFFFF" size={21} />
      </TouchableOpacity>
      <Modal
        visible={visible}
        transparent
        animationType={reduceMotion ? "none" : "fade"}
        onRequestClose={() => setVisible(false)}
      >
        <View style={styles.overlay}>
          <Pressable
            accessible={false}
            onPress={() => setVisible(false)}
            style={StyleSheet.absoluteFill}
          />
          <View
            accessibilityViewIsModal
            style={[
              styles.sheet,
              { paddingBottom: Math.max(insets.bottom, 20) + 16 },
            ]}
          >
            <View style={styles.sheetHeader}>
              <Text accessibilityRole="header" style={styles.sheetTitle}>
                Programa tus pagos
              </Text>
              <TouchableOpacity
                accessibilityLabel="Cerrar"
                accessibilityRole="button"
                onPress={() => setVisible(false)}
                style={styles.close}
              >
                <X size={21} color={C.ink} />
              </TouchableOpacity>
            </View>
            <Text style={styles.badge}>Próximamente</Text>
            <Text style={styles.description}>
              La programación de pagos estará disponible próximamente. Por
              ahora, guarda tus servicios frecuentes para encontrarlos más
              rápido en tu próximo pago.
            </Text>
            <TouchableOpacity
              accessibilityRole="button"
              onPress={() => setVisible(false)}
              style={styles.done}
            >
              <Text style={styles.doneText}>Entendido</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  banner: {
    minHeight: 74,
    borderRadius: 18,
    backgroundColor: "#083CAE",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    boxShadow: "0 7px 16px rgba(10,47,123,0.12)",
  },
  copy: { flex: 1, zIndex: 1 },
  title: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: -0.35,
  },
  subtitle: { color: "#D7E5FF", fontSize: 11, lineHeight: 16, marginTop: 3 },
  calendar: {
    width: 46,
    height: 52,
    transform: [{ rotate: "-10deg" }, { scale: 0.8 }],
    marginRight: 0,
  },
  backPage: {
    position: "absolute",
    left: 6,
    top: 9,
    width: 45,
    height: 48,
    backgroundColor: "#B9CBE1",
    borderRadius: 6,
    transform: [{ rotate: "12deg" }],
  },
  page: {
    width: 47,
    height: 51,
    borderRadius: 6,
    backgroundColor: "#FFFFFF",
    top: 3,
    overflow: "hidden",
  },
  calendarTop: { height: 15, backgroundColor: "#9CE2AB" },
  calendarDays: { padding: 8, flexDirection: "row", flexWrap: "wrap", gap: 5 },
  day: { width: 6, height: 4, borderRadius: 2, backgroundColor: "#D6E2DB" },
  selectedDay: { backgroundColor: C.blueAction },
  ring: {
    position: "absolute",
    width: 5,
    height: 13,
    borderRadius: 3,
    backgroundColor: "#E5EDF6",
    top: -1,
    borderWidth: 1,
    borderColor: "#B3C2D0",
  },
  leftRing: { left: 10 },
  rightRing: { left: 32 },
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
    backgroundColor: "rgba(9,35,22,0.35)",
  },
  sheet: {
    width: "100%",
    maxWidth: 520,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  sheetTitle: { color: C.ink, fontSize: 22, fontWeight: "600", flex: 1 },
  close: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    color: C.blueAction,
    fontSize: 12,
    fontWeight: "600",
    marginTop: 12,
  },
  description: {
    color: "#6D8073",
    fontSize: 15,
    lineHeight: 23,
    marginTop: 12,
  },
  done: {
    backgroundColor: C.blueAction,
    borderRadius: 26,
    minHeight: 52,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 25,
  },
  doneText: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },
});
