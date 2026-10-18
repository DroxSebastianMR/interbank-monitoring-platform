import { Mail, Smartphone } from "lucide-react-native";
import React from "react";
import { StyleSheet, Text } from "react-native";
import type { useRegistration } from "@/src/modules/registration/hooks/useRegistration";
import { AuthInput } from "@/src/modules/auth/components/AuthInput";

export function RegistrationContactStep({
  flow,
}: {
  flow: ReturnType<typeof useRegistration>;
}) {
  return (
    <>
      <Text style={styles.subtitle}>
        Usa un correo y un celular a los que tengas acceso.
      </Text>
      <AuthInput
        variant="login"
        label="Correo electrónico"
        placeholder="Ingresa tu correo"
        icon={<Mail size={20} color="#76887C" />}
        value={flow.draft.email}
        onChangeText={(value) => flow.change("email", value)}
        onBlur={() => flow.touch("email")}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        textContentType="emailAddress"
        maxLength={254}
        error={flow.errors.email}
      />
      <AuthInput
        variant="login"
        label="Celular"
        placeholder="9 dígitos"
        icon={<Smartphone size={20} color="#76887C" />}
        value={flow.draft.phone}
        onChangeText={(value) => flow.change("phone", value.replace(/\D/g, ""))}
        onBlur={() => flow.touch("phone")}
        keyboardType="phone-pad"
        maxLength={9}
        autoComplete="tel-national"
        textContentType="telephoneNumber"
        error={flow.errors.phone}
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
    marginBottom: 26,
  },
});
