import { KeyRound, Mail } from "lucide-react-native";
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

export function LoginScreen() {
  const { form, loading, fieldErrors, onChange, handleLogin } = useLogin();
  const { reduceTransparency, reduceMotion } = useAuthAccessibility();
  const [helpTopic, setHelpTopic] = useState<LoginHelpTopic>("menu");
  const [helpVisible, setHelpVisible] = useState(false);
  const documentRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
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
    <LoginScaffold>
      <LoginDocumentField
        value={form.documentNumber}
        error={fieldErrors.documentNumber}
        disabled={loading}
        reduceTransparency={reduceTransparency}
        onChange={(value) => onChange("documentNumber", value)}
        inputRef={documentRef}
      />
      <AuthInput
        variant="login"
        label="Correo"
        placeholder="Ingresa tu correo"
        icon={<Mail color="#72867A" size={20} strokeWidth={1.7} />}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        value={form.email}
        editable={!loading}
        onChangeText={(value) => onChange("email", value)}
        error={fieldErrors.email}
        showErrorMessage={false}
        keyboardAppearance="light"
        textContentType="emailAddress"
        autoComplete="email"
        returnKeyType="next"
        onSubmitEditing={() => passwordRef.current?.focus()}
        inputRef={emailRef}
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
        error={fieldErrors.password}
        showErrorMessage={false}
        keyboardAppearance="light"
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
        disabled={loading}
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
        <View style={styles.registrationRow}>
          <Text style={styles.newUser}>¿Aún no tienes usuario?</Text>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => openHelp("registration")}
            disabled={loading}
            accessibilityRole="button"
            accessibilityLabel="Crear usuario"
            style={styles.create}
          >
            <Text style={styles.createText}>Crear usuario</Text>
          </TouchableOpacity>
        </View>
      </View>
      <LoginHelpSheet
        visible={helpVisible}
        topic={helpTopic}
        onSelect={setHelpTopic}
        onClose={closeHelp}
        reduceMotion={reduceMotion}
      />
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
  registration: { marginTop: 14 },
  registrationRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "wrap",
    columnGap: 6,
  },
  newUser: { fontSize: 13, color: "#65786B" },
  create: {
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  createText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#007A34",
    textDecorationLine: "underline",
  },
});
