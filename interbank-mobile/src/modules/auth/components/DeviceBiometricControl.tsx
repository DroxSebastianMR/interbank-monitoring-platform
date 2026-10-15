import { Fingerprint, ScanFace } from "lucide-react-native";
import React from "react";
import { StyleSheet, Switch, Text, View } from "react-native";

import { BiometricKind } from "@/src/domain/auth/biometric.types";
import { LiquidGlassSurface } from "@/src/shared/components/LiquidGlassSurface";
import { BANKING_COLORS } from "@/src/shared/theme/banking.theme";

interface Props {
  kind: BiometricKind;
  enabled: boolean;
  available: boolean;
  disabled: boolean;
  checking: boolean;
  pendingEnrollment: boolean;
  reduceTransparency: boolean;
  onToggle: (enabled: boolean) => void;
}

export function DeviceBiometricControl({
  kind,
  enabled,
  available,
  disabled,
  checking,
  pendingEnrollment,
  reduceTransparency,
  onToggle,
}: Props) {
  const faceId = kind === BiometricKind.FACE_ID;
  const label = faceId ? "Face ID" : "Huella digital";
  return (
    <LiquidGlassSurface
      tone="neutral"
      intensity={16}
      opaque={reduceTransparency}
      style={styles.surface}
    >
      <View style={styles.row}>
        <View style={styles.icon}>
          {faceId ? (
            <ScanFace size={24} color={BANKING_COLORS.greenDeep} />
          ) : (
            <Fingerprint size={24} color={BANKING_COLORS.greenDeep} />
          )}
        </View>
        <View style={styles.content}>
          <Text style={styles.title}>
            {enabled ? label : `Activar ${label}`}
          </Text>
          <Text style={styles.description}>
            {checking
              ? "Preparando el acceso…"
              : pendingEnrollment
                ? "Confirma tu contraseña para activar"
                : !available
                  ? "No disponible en este dispositivo"
                  : enabled
                    ? "Acceso protegido en este teléfono"
                    : "Ingresa de forma rápida y segura"}
          </Text>
        </View>
        <Switch
          value={enabled || pendingEnrollment}
          onValueChange={onToggle}
          disabled={disabled || checking || !available}
          accessibilityLabel={`${enabled || pendingEnrollment ? "Desactivar" : "Activar"} ${label}`}
          trackColor={{ false: "#D6E0DA", true: BANKING_COLORS.green }}
          thumbColor="#FFFFFF"
          ios_backgroundColor="#D6E0DA"
        />
      </View>
    </LiquidGlassSurface>
  );
}

const styles = StyleSheet.create({
  surface: {
    marginTop: 18,
    borderRadius: 20,
    backgroundColor: "#EDF5F0",
    borderWidth: 1,
    borderColor: "#DDE9E1",
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  row: { zIndex: 1, flexDirection: "row", alignItems: "center", gap: 10 },
  icon: { width: 30, alignItems: "center" },
  content: { flex: 1 },
  title: { color: BANKING_COLORS.ink, fontSize: 14, fontWeight: "600" },
  description: { color: "#65786B", fontSize: 11, lineHeight: 16, marginTop: 3 },
});
