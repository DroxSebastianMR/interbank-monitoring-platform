import { X } from "lucide-react-native";
import React from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BANKING_COLORS as C } from "@/src/shared/theme/banking.theme";

export type RegistrationSheetTopic =
  | "privacy"
  | "help"
  | "verification"
  | "identity";

const CONTENT: Record<
  RegistrationSheetTopic,
  { title: string; paragraphs: string[] }
> = {
  privacy: {
    title: "Privacidad del registro",
    paragraphs: [
      "Este registro es una vista previa. Los datos se mantienen en memoria mientras recorres los pasos; no se envían al servidor ni se guardan en el dispositivo.",
      "No se capturan fotos ni códigos de verificación. La contraseña se descarta al llegar a revisión, retroceder desde seguridad o enviar la app a segundo plano. Al salir del registro se descarta el borrador.",
      "La política de privacidad definitiva deberá estar disponible antes de habilitar la creación de usuarios.",
    ],
  },
  help: {
    title: "Ayuda con tu registro",
    paragraphs: [
      "Ingresa los 8 dígitos de tu DNI y un celular peruano de 9 dígitos que comience con 9.",
      "El usuario propuesto admite de 6 a 20 letras o números. Revisa los indicadores debajo de la contraseña y repítela exactamente igual.",
      "En esta vista previa no se envían correos ni se valida tu identidad. En esos pasos, usa «Ver siguiente paso» para recorrer el diseño.",
      "Si ya tienes un usuario, vuelve al inicio e ingresa con tus datos. Completar esta vista previa no cambia tus accesos actuales.",
    ],
  },
  verification: {
    title: "Código de verificación",
    paragraphs: [
      "El envío y la validación de códigos estarán disponibles cuando se habilite el registro. Por ahora no se ha enviado ningún código a tu correo.",
      "Puedes corregir el correo o usar «Ver siguiente paso» para recorrer el diseño. Esto no marca el correo como verificado.",
    ],
  },
  identity: {
    title: "Validación de identidad",
    paragraphs: [
      "La validación de identidad requerirá un servicio que compruebe el documento y la selfie. Preparar una foto o desbloquear el teléfono con Face ID no equivale a verificar tu identidad con el banco.",
      "En esta vista previa no se abre la cámara, no se solicita permiso y no se captura tu rostro. Puedes recorrer los pasos sin hacer una validación real.",
    ],
  },
};

export function RegistrationSheet({
  topic,
  onClose,
  reduceMotion,
}: {
  topic: RegistrationSheetTopic | null;
  onClose: () => void;
  reduceMotion: boolean;
}) {
  const insets = useSafeAreaInsets();
  const content = CONTENT[topic ?? "help"];
  return (
    <Modal
      visible={topic !== null}
      transparent
      animationType={reduceMotion ? "none" : "fade"}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable
          accessible={false}
          onPress={onClose}
          style={StyleSheet.absoluteFill}
        />
        <View
          accessibilityViewIsModal
          style={[
            styles.sheet,
            { paddingBottom: Math.max(insets.bottom, 20) + 12 },
          ]}
        >
          <View style={styles.header}>
            <Text accessibilityRole="header" style={styles.title}>
              {content.title}
            </Text>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Cerrar"
              onPress={onClose}
              style={styles.close}
            >
              <X size={21} color={C.ink} />
            </TouchableOpacity>
          </View>
          <ScrollView bounces={false}>
            {content.paragraphs.map((paragraph) => (
              <Text key={paragraph} style={styles.copy}>
                {paragraph}
              </Text>
            ))}
          </ScrollView>
          <TouchableOpacity
            accessibilityRole="button"
            onPress={onClose}
            style={styles.done}
          >
            <Text style={styles.doneText}>Entendido</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    backgroundColor: "rgba(9,35,22,0.35)",
  },
  sheet: {
    width: "100%",
    maxWidth: 520,
    maxHeight: "85%",
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 10,
  },
  title: { flex: 1, color: C.ink, fontSize: 22, fontWeight: "600" },
  close: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  copy: { color: "#6F8075", fontSize: 14, lineHeight: 22, marginTop: 13 },
  done: {
    minHeight: 52,
    backgroundColor: C.blueAction,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
  },
  doneText: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },
});
