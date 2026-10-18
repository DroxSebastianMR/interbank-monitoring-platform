import { Glasses, ScanFace, Sun, UserRound } from "lucide-react-native";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { LiquidGlassSurface } from "@/src/shared/components/LiquidGlassSurface";
import { RegistrationNotice } from "./RegistrationNotice";
import { BANKING_COLORS as C } from "@/src/shared/theme/banking.theme";

export function RegistrationIdentityStep({
  opaque,
  onHelp,
}: {
  opaque: boolean;
  onHelp: () => void;
}) {
  return (
    <>
      <Text style={styles.subtitle}>
        Ten tu DNI a la mano y prepara un lugar con buena luz.
      </Text>
      <View style={styles.portrait}>
        <View style={styles.guide} />
        <LiquidGlassSurface
          opaque={opaque}
          intensity={12}
          tone="green"
          style={styles.face}
        >
          <View style={styles.foreground}>
            <ScanFace size={62} color={C.green} strokeWidth={1.2} />
          </View>
        </LiquidGlassSurface>
      </View>
      <View style={styles.instructions}>
        {[
          { Icon: Sun, text: "Busca una iluminación uniforme." },
          { Icon: Glasses, text: "Retira lentes de sol, gorra y mascarilla." },
          {
            Icon: UserRound,
            text: "Mantén el rostro descubierto y dentro del marco.",
          },
        ].map(({ Icon, text }) => (
          <View key={text} style={styles.instruction}>
            <Icon color={C.greenDeep} size={20} strokeWidth={1.6} />
            <Text style={styles.instructionText}>{text}</Text>
          </View>
        ))}
      </View>
      <TouchableOpacity
        accessibilityRole="button"
        onPress={onHelp}
        style={styles.help}
      >
        <Text style={styles.helpText}>¿Cómo se validará mi identidad?</Text>
      </TouchableOpacity>
      <RegistrationNotice description="La validación facial todavía no está disponible. En esta vista previa no se abre la cámara ni se captura tu rostro." />
    </>
  );
}

const styles = StyleSheet.create({
  subtitle: {
    color: "#7A8B80",
    fontSize: 13,
    lineHeight: 21,
    textAlign: "center",
  },
  portrait: {
    alignSelf: "center",
    width: 166,
    height: 190,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 25,
  },
  guide: {
    position: "absolute",
    width: 145,
    height: 185,
    borderRadius: 76,
    borderWidth: 1.5,
    borderColor: "#A6D8B9",
    borderStyle: "dashed",
  },
  face: {
    height: 116,
    width: 104,
    borderRadius: 48,
    backgroundColor: "#F2FAF5",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  foreground: { zIndex: 1 },
  instructions: { gap: 15 },
  instruction: { flexDirection: "row", alignItems: "center", gap: 12 },
  instructionText: { flex: 1, color: "#62776A", fontSize: 12, lineHeight: 19 },
  help: {
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 14,
  },
  helpText: {
    color: C.greenDeep,
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
});
