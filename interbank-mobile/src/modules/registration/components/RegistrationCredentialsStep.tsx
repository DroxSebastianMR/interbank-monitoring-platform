import { Check, Circle, KeyRound, UserRound } from "lucide-react-native";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { getRegistrationPasswordChecks } from "@/src/domain/registration/registration.validation";
import { AuthInput } from "@/src/modules/auth/components/AuthInput";
import type { useRegistration } from "@/src/modules/registration/hooks/useRegistration";
import { BANKING_COLORS as C } from "@/src/shared/theme/banking.theme";

export function RegistrationCredentialsStep({
  flow,
}: {
  flow: ReturnType<typeof useRegistration>;
}) {
  return (
    <>
      <AuthInput
        variant="login"
        label="Usuario digital"
        placeholder="Elige tu usuario"
        icon={<UserRound size={20} color="#76887C" />}
        value={flow.draft.username}
        onChangeText={(value) => flow.change("username", value)}
        onBlur={() => flow.touch("username")}
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="off"
        maxLength={20}
        error={flow.errors.username}
      />
      <Text style={styles.hint}>De 6 a 20 letras o números, sin espacios.</Text>
      <AuthInput
        variant="login"
        label="Contraseña"
        placeholder="Crea una contraseña"
        icon={<KeyRound size={20} color="#76887C" />}
        secure
        value={flow.draft.password}
        onChangeText={(value) => flow.change("password", value)}
        onBlur={() => flow.touch("password")}
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="off"
        textContentType="none"
        maxLength={128}
        error={flow.errors.password}
      />
      <View style={styles.checks} accessibilityLiveRegion="polite">
        {getRegistrationPasswordChecks(flow.draft).map((item) => (
          <View key={item.label} style={styles.check}>
            {item.met ? (
              <Check size={14} color={C.green} />
            ) : (
              <Circle size={11} color="#A1B1A6" />
            )}
            <Text style={[styles.checkText, item.met && styles.met]}>
              {item.label}
            </Text>
          </View>
        ))}
      </View>
      <AuthInput
        variant="login"
        label="Confirma tu contraseña"
        placeholder="Escríbela nuevamente"
        secure
        value={flow.draft.confirmPassword}
        onChangeText={(value) => flow.change("confirmPassword", value)}
        onBlur={() => flow.touch("confirmPassword")}
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="off"
        textContentType="none"
        maxLength={128}
        error={flow.errors.confirmPassword}
      />
      <Text style={styles.hint}>
        Estos datos no activarán un usuario durante la vista previa.
      </Text>
    </>
  );
}

const styles = StyleSheet.create({
  hint: {
    color: "#829186",
    fontSize: 12,
    lineHeight: 19,
    marginBottom: 23,
    marginTop: -3,
  },
  checks: { gap: 9, marginBottom: 24, marginTop: 1 },
  check: { flexDirection: "row", gap: 9, alignItems: "center" },
  checkText: { flex: 1, fontSize: 11, lineHeight: 17, color: "#8B9A90" },
  met: { color: C.greenDeep },
});
