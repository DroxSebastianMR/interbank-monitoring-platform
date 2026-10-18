import { Clock3 } from "lucide-react-native";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { LiquidGlassSurface } from "@/src/shared/components/LiquidGlassSurface";
import { BANKING_COLORS as C } from "@/src/shared/theme/banking.theme";

export function RegistrationCompletionStep({ opaque }: { opaque: boolean }) {
  return (
    <View style={styles.content}>
      <LiquidGlassSurface
        opaque={opaque}
        tone="blue"
        intensity={12}
        style={styles.icon}
      >
        <View style={styles.foreground}>
          <Clock3 size={40} color={C.blueAction} strokeWidth={1.5} />
        </View>
      </LiquidGlassSurface>
      <Text style={styles.title}>Has terminado la vista previa</Text>
      <Text style={styles.copy}>
        Ya conoces los pasos para crear tu acceso digital. El registro de
        usuarios estará disponible próximamente.
      </Text>
      <Text style={styles.note}>
        No se ha creado una cuenta ni se han enviado tus datos.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { alignItems: "center", paddingVertical: 14 },
  icon: {
    width: 98,
    height: 98,
    borderRadius: 33,
    backgroundColor: "#EEF4FD",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 27,
  },
  foreground: { zIndex: 1 },
  title: {
    fontSize: 21,
    fontWeight: "500",
    lineHeight: 28,
    textAlign: "center",
    color: C.ink,
  },
  copy: {
    color: "#7A8B80",
    fontSize: 14,
    lineHeight: 23,
    textAlign: "center",
    marginTop: 15,
  },
  note: {
    color: C.greenDeep,
    fontSize: 12,
    lineHeight: 19,
    textAlign: "center",
    marginTop: 22,
  },
});
