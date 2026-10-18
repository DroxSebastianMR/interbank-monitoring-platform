import { Pencil, ShieldCheck } from "lucide-react-native";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { RegistrationStep } from "@/src/domain/registration/registration.types";
import type { RegistrationDraft } from "@/src/domain/registration/registration.types";
import { RegistrationNotice } from "./RegistrationNotice";
import { BANKING_COLORS as C } from "@/src/shared/theme/banking.theme";

export function RegistrationReviewStep({
  draft,
  onEdit,
}: {
  draft: RegistrationDraft;
  onEdit: (step: RegistrationStep) => void;
}) {
  return (
    <>
      <Text style={styles.subtitle}>
        Puedes corregir tus datos antes de terminar el recorrido.
      </Text>
      {[
        {
          title: "Documento",
          value: `${draft.documentType} · ${draft.documentNumber}`,
          step: RegistrationStep.DOCUMENT,
        },
        {
          title: "Contacto",
          value: `${draft.email}\n${draft.phone}`,
          step: RegistrationStep.CONTACT,
        },
        {
          title: "Usuario digital",
          value: draft.username,
          step: RegistrationStep.SECURITY,
        },
      ].map((item) => (
        <View key={item.title} style={styles.row}>
          <View style={styles.copy}>
            <Text style={styles.label}>{item.title}</Text>
            <Text style={styles.value}>{item.value}</Text>
          </View>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={`Editar ${item.title.toLowerCase()}`}
            onPress={() => onEdit(item.step)}
            style={styles.edit}
          >
            <Pencil size={17} color={C.greenDeep} />
          </TouchableOpacity>
        </View>
      ))}
      <View style={styles.status}>
        <ShieldCheck size={19} color="#82968A" />
        <Text style={styles.statusText}>
          Correo e identidad pendientes de verificación
        </Text>
      </View>
      <RegistrationNotice
        title="Aún no se creará una cuenta"
        description="Finalizar este recorrido no registra usuarios ni activa el acceso a la app."
      />
    </>
  );
}

const styles = StyleSheet.create({
  subtitle: {
    color: "#7A8B80",
    fontSize: 13,
    lineHeight: 21,
    textAlign: "center",
    marginBottom: 15,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E7EEE9",
    paddingVertical: 18,
  },
  copy: { flex: 1 },
  label: { fontSize: 12, color: "#8A988F" },
  value: { fontSize: 15, color: C.ink, lineHeight: 23, marginTop: 7 },
  edit: {
    height: 44,
    width: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  status: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 22,
  },
  statusText: { flex: 1, fontSize: 12, lineHeight: 19, color: "#7A8B80" },
});
