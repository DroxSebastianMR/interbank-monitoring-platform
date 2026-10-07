import { KeyRound, UserRound } from "lucide-react-native";
import React, { useRef, useState } from "react";
import {
  Keyboard,
  TouchableOpacity,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { AuthInput } from "@/src/modules/auth/components/AuthInput";
import { LoginDocumentField } from "@/src/modules/auth/components/LoginDocumentField";
import { LoginHelpSheet } from "@/src/modules/auth/components/LoginHelpSheet";
import type { LoginHelpTopic } from "@/src/modules/auth/components/LoginHelpSheet";
import { LoginScaffold } from "@/src/modules/auth/components/LoginScaffold";
import { LoginSubmitButton } from "@/src/modules/auth/components/LoginSubmitButton";
import { useAuthAccessibility } from "@/src/modules/auth/hooks/useAuthAccessibility";
import { useLogin } from "@/src/modules/auth/hooks/useLogin";
import { ScreenLoader } from "@/src/modules/system/ui/components/ScreenLoader";
import { BANKING_COLORS } from "@/src/shared/theme/banking.theme";

export function LoginScreen() {
  const { form, loading, isValid, fieldErrors, onChange, onBlur, handleLogin } =
    useLogin();
  const { reduceTransparency, reduceMotion } = useAuthAccessibility();
  const [helpTopic, setHelpTopic] = useState<LoginHelpTopic>("menu");
  const [helpVisible, setHelpVisible] = useState(false);
  const documentRef = useRef<TextInput>(null);
  const userRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  const openHelp = (topic: LoginHelpTopic) => {
    if (loading) return;
    Keyboard.dismiss();
    setHelpTopic(topic);
    setHelpVisible(true);
  };
  const closeHelp = () => {
    setHelpVisible(false);
  };

  return (
    <LoginScaffold
      onMenuPress={() => openHelp("menu")}
      disabled={loading}
      reduceTransparency={reduceTransparency}
    >
      <LoginDocumentField
        value={form.documentNumber}
        error={fieldErrors.documentNumber}
        disabled={loading}
        onChange={(value) => onChange("documentNumber", value)}
        onBlur={() => onBlur("documentNumber")}
        onDocumentPress={() => openHelp("document")}
        inputRef={documentRef}
        onNext={() => userRef.current?.focus()}
      />
      <AuthInput
        variant="login"
        label="Usuario"
        placeholder="Ingresa tu usuario"
        icon={<UserRound color="#72867A" size={20} strokeWidth={1.7} />}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        value={form.email}
        editable={!loading}
        onChangeText={(value) => onChange("email", value)}
        onBlur={() => onBlur("email")}
        error={fieldErrors.email}
        textContentType="username"
        autoComplete="username"
        returnKeyType="next"
        onSubmitEditing={() => passwordRef.current?.focus()}
        inputRef={userRef}
      />
      <AuthInput
        variant="login"
        label="Contraseña"
        placeholder="Ingresa tu contraseña"
        icon={<KeyRound color="#72867A" size={20} strokeWidth={1.7} />}
        secure
        value={form.password}
        editable={!loading}
        autoCapitalize="none"
        autoCorrect={false}
        onChangeText={(value) => onChange("password", value)}
        onBlur={() => onBlur("password")}
        error={fieldErrors.password}
        textContentType="password"
        autoComplete="current-password"
        returnKeyType="go"
        onSubmitEditing={() => {
          Keyboard.dismiss();
          void handleLogin();
        }}
        inputRef={passwordRef}
      />
      <LoginSubmitButton
        onPress={() => {
          Keyboard.dismiss();
          void handleLogin();
        }}
        disabled={loading || !isValid}
        loading={loading}
        reduceTransparency={reduceTransparency}
      />
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => openHelp("recovery")}
        disabled={loading}
        accessibilityRole="button"
        accessibilityLabel="¿Olvidaste tu contraseña o usuario?"
        accessibilityHint="Abre la ayuda para recuperar tu acceso"
        accessibilityState={{ disabled: loading }}
        style={styles.recovery}
      >
        <Text style={styles.recoveryText}>
          ¿Olvidaste tu contraseña o usuario?
        </Text>
      </TouchableOpacity>
      <View style={styles.registration}>
        <View style={styles.divider}>
          <View style={styles.line} />
          <Text style={styles.newUser}>¿Aún no tienes usuario?</Text>
          <View style={styles.line} />
        </View>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => openHelp("registration")}
          disabled={loading}
          accessibilityRole="button"
          style={styles.create}
        >
          <Text style={styles.createText}>Crear usuario</Text>
        </TouchableOpacity>
        <Text style={styles.disclaimer}>
          Banca simulada · No procesa dinero real
        </Text>
      </View>
      <LoginHelpSheet
        visible={helpVisible}
        topic={helpTopic}
        onSelect={setHelpTopic}
        onClose={closeHelp}
        reduceMotion={reduceMotion}
      />
      <ScreenLoader visible={loading} />
    </LoginScaffold>
  );
}

const styles = StyleSheet.create({
  recovery: {
    marginTop: 14,
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 10,
  },
  recoveryText: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "600",
    color: "#007A34",
    textAlign: "center",
    textDecorationLine: "underline",
  },
  registration: { marginTop: "auto", paddingTop: 24 },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  line: { height: 1, flex: 1, backgroundColor: "#DCE6DF" },
  newUser: { fontSize: 13, color: "#65786B" },
  create: {
    borderWidth: 1,
    borderColor: BANKING_COLORS.green,
    minHeight: 54,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
  },
  createText: { fontSize: 16, fontWeight: "600", color: BANKING_COLORS.green },
  disclaimer: {
    color: "#718379",
    fontSize: 10,
    textAlign: "center",
    marginTop: 20,
  },
});
