import {
  Check,
  ChevronRight,
  KeyRound,
  Mail,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react-native";
import React, { useRef } from "react";
import {
  AccessibilityInfo,
  findNodeHandle,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export type LoginHelpTopic =
  | "menu"
  | "recovery"
  | "password"
  | "username"
  | "registration"
  | "document"
  | "qr"
  | "whatsapp";

const CONTENT: Record<LoginHelpTopic, { title: string; description: string }> =
  {
    menu: {
      title: "Estamos para ayudarte",
      description: "Todo lo que necesitas para ingresar a tu banca digital.",
    },
    recovery: {
      title: "Recupera tu acceso",
      description: "Elige qué dato necesitas recordar.",
    },
    password: {
      title: "¿Olvidaste tu contraseña?",
      description:
        "La recuperación de contraseña aún no está disponible en esta app. No podemos cambiar tu contraseña desde aquí por el momento.",
    },
    username: {
      title: "Recuerda tu usuario",
      description:
        "Tu usuario es el correo electrónico registrado en tu cuenta. Utilízalo junto con tu DNI y contraseña para ingresar.",
    },
    registration: {
      title: "Crea tu usuario digital",
      description:
        "El registro de usuarios aún no está disponible en esta app. Si ya tienes una cuenta registrada, ingresa con tu DNI, correo y contraseña.",
    },
    document: {
      title: "Tu documento de identidad",
      description: "Por ahora puedes ingresar con tu DNI peruano de 8 dígitos.",
    },
    qr: {
      title: "Tu QR personal",
      description:
        "Los cobros con tu QR personal estarán disponibles próximamente.",
    },
    whatsapp: {
      title: "Plinear por WhatsApp",
      description:
        "Esta función estará disponible próximamente. Por ahora, ingresa a la app para usar los servicios habilitados.",
    },
  };

interface Props {
  topic: LoginHelpTopic;
  visible: boolean;
  onSelect: (topic: LoginHelpTopic) => void;
  onClose: () => void;
  reduceMotion: boolean;
}

export function LoginHelpSheet({
  visible,
  topic,
  onSelect,
  onClose,
  reduceMotion,
}: Props) {
  const insets = useSafeAreaInsets();
  const titleRef = useRef<Text>(null);
  const content = CONTENT[topic];
  const options = topic === "menu" || topic === "recovery";

  const focusTitle = () => {
    if (Platform.OS === "web") return;
    const node = findNodeHandle(titleRef.current);
    if (node) AccessibilityInfo.setAccessibilityFocus(node);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType={reduceMotion ? "none" : "fade"}
      onRequestClose={onClose}
      onShow={focusTitle}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessible={false}
        />
        <View
          accessibilityViewIsModal
          style={[
            styles.sheet,
            { paddingBottom: Math.max(insets.bottom, 20) + 12 },
          ]}
        >
          <View style={styles.handle} />
          <View style={styles.header}>
            <View style={styles.icon}>
              <ShieldCheck size={23} color="#008D3B" />
            </View>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Cerrar ayuda"
              style={styles.close}
            >
              <X size={21} color="#51685B" />
            </Pressable>
          </View>
          <ScrollView
            bounces={false}
            contentContainerStyle={styles.scrollContent}
          >
            <Text
              ref={titleRef}
              accessibilityRole="header"
              accessible
              style={styles.title}
            >
              {content.title}
            </Text>
            <Text style={styles.description}>{content.description}</Text>
            {options ? (
              <View style={styles.options}>
                <HelpOption
                  title="Recuperar contraseña"
                  subtitle="Ayuda para volver a ingresar"
                  icon={<KeyRound size={21} color="#008D3B" />}
                  onPress={() => onSelect("password")}
                />
                <HelpOption
                  title="Recordar usuario"
                  subtitle="Encuentra el dato que usas para ingresar"
                  icon={<Mail size={21} color="#008D3B" />}
                  onPress={() => onSelect("username")}
                />
                {topic === "menu" ? (
                  <HelpOption
                    title="Crear usuario"
                    subtitle="Información sobre el registro"
                    icon={<UserRound size={21} color="#008D3B" />}
                    onPress={() => onSelect("registration")}
                  />
                ) : null}
              </View>
            ) : topic === "document" ? (
              <View style={styles.document}>
                <Text style={styles.documentText}>DNI · 8 dígitos</Text>
                <Check size={20} color="#008D3B" />
              </View>
            ) : null}
            {!options ? (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={onClose}
                accessibilityRole="button"
                style={styles.done}
              >
                <Text style={styles.doneText}>Volver al ingreso</Text>
              </TouchableOpacity>
            ) : null}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function HelpOption({
  title,
  subtitle,
  icon,
  onPress,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      accessibilityRole="button"
      style={styles.option}
    >
      <View style={styles.optionIcon}>{icon}</View>
      <View style={styles.optionContent}>
        <Text style={styles.optionTitle}>{title}</Text>
        <Text style={styles.optionSubtitle}>{subtitle}</Text>
      </View>
      <ChevronRight size={18} color="#63796B" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(9,35,22,0.36)",
    alignItems: "center",
  },
  sheet: {
    width: "100%",
    maxWidth: 480,
    maxHeight: "85%",
    backgroundColor: "#F7FAF8",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 24,
    paddingTop: 10,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#D7E2DB",
    alignSelf: "center",
    marginBottom: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  icon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#E5F4EA",
    justifyContent: "center",
    alignItems: "center",
  },
  close: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
    backgroundColor: "#EAF0EC",
  },
  scrollContent: { paddingBottom: 4 },
  title: {
    fontSize: 25,
    fontWeight: "600",
    color: "#173A27",
    letterSpacing: -0.6,
  },
  description: {
    color: "#62736A",
    fontSize: 15,
    lineHeight: 23,
    marginTop: 10,
  },
  options: { gap: 10, marginTop: 24 },
  option: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E0E9E3",
  },
  optionIcon: { width: 24, alignItems: "center" },
  optionContent: { flex: 1 },
  optionTitle: { color: "#173A27", fontSize: 15, fontWeight: "600" },
  optionSubtitle: {
    color: "#62736A",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 3,
  },
  document: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 18,
    borderRadius: 16,
    backgroundColor: "#EAF5EE",
    marginTop: 22,
  },
  documentText: { color: "#173A27", fontWeight: "600", fontSize: 16 },
  done: {
    padding: 17,
    alignItems: "center",
    backgroundColor: "#008D3B",
    borderRadius: 16,
    marginTop: 26,
  },
  doneText: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },
});
