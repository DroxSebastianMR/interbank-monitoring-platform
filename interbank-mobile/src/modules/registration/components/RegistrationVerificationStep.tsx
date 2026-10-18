import { Mail } from "lucide-react-native";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { LiquidGlassSurface } from "@/src/shared/components/LiquidGlassSurface";
import { RegistrationNotice } from "./RegistrationNotice";
import { BANKING_COLORS as C } from "@/src/shared/theme/banking.theme";

function maskEmail(email: string) {
  const [name, domain] = email.split("@");
  return `${name.slice(0, 2)}•••@${domain ?? ""}`;
}

export function RegistrationVerificationStep({
  email,
  opaque,
  onEdit,
  onRequest,
}: {
  email: string;
  opaque: boolean;
  onEdit: () => void;
  onRequest: () => void;
}) {
  return (
    <>
      <LiquidGlassSurface
        intensity={12}
        tone="green"
        opaque={opaque}
        style={styles.icon}
      >
        <View style={styles.foreground}>
          <Mail color={C.greenDeep} size={31} strokeWidth={1.5} />
        </View>
      </LiquidGlassSurface>
      <Text style={styles.caption}>El código de verificación se enviará a</Text>
      <Text style={styles.email}>{maskEmail(email)}</Text>
      <TouchableOpacity
        accessibilityRole="button"
        onPress={onEdit}
        style={styles.linkButton}
      >
        <Text style={styles.link}>Cambiar correo</Text>
      </TouchableOpacity>
      <View
        accessible
        accessibilityLabel="Campo de código de verificación pendiente de habilitar"
        style={styles.code}
      >
        {Array.from({ length: 6 }, (_, index) => (
          <View key={index} style={styles.digit}>
            <Text style={styles.dash}>—</Text>
          </View>
        ))}
      </View>
      <TouchableOpacity
        accessibilityRole="button"
        onPress={onRequest}
        style={styles.linkButton}
      >
        <Text style={styles.link}>Solicitar código de verificación</Text>
      </TouchableOpacity>
      <RegistrationNotice description="Todavía no se ha enviado ningún código. Puedes ver el siguiente paso sin verificar tu correo." />
    </>
  );
}

const styles = StyleSheet.create({
  icon: {
    alignSelf: "center",
    width: 76,
    height: 76,
    borderRadius: 26,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EEF9F2",
    marginBottom: 19,
  },
  foreground: { zIndex: 1 },
  caption: {
    textAlign: "center",
    color: "#829186",
    fontSize: 13,
    lineHeight: 20,
  },
  email: {
    color: C.ink,
    fontSize: 15,
    fontWeight: "500",
    textAlign: "center",
    marginTop: 7,
  },
  linkButton: {
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
  },
  link: {
    color: C.greenDeep,
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  code: { flexDirection: "row", gap: 7, marginVertical: 23 },
  digit: {
    flex: 1,
    minWidth: 0,
    minHeight: 55,
    borderWidth: 1,
    borderColor: "#DDE8E1",
    borderRadius: 12,
    backgroundColor: "#F8FBF9",
    alignItems: "center",
    justifyContent: "center",
  },
  dash: { color: "#B4C1B8", fontSize: 20 },
});
