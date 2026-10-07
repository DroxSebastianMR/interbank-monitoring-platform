import { FileText, LockKeyhole, Mail } from "lucide-react-native";
import React from "react";
import { Pressable, Text, View } from "react-native";

import { AuthButton } from "@/src/modules/auth/components/AuthButton";
import { AuthInput } from "@/src/modules/auth/components/AuthInput";
import { AuthScaffold } from "@/src/modules/auth/components/AuthScaffold";
import { useLogin } from "@/src/modules/auth/hooks/useLogin";
import { ScreenLoader } from "@/src/modules/system/ui/components/ScreenLoader";
import { useToast } from "@/src/modules/system/ui/hooks/useToast";

const FIELD_ICON_COLOR = "#66756d";

export function LoginScreen() {
  const { form, loading, isValid, onChange, handleLogin } = useLogin();
  const { show } = useToast();

  return (
    <AuthScaffold>
      <View className="mb-7">
        <Text className="text-[28px] font-black tracking-[-0.6px] text-[#14261c]">
          Ingresa a tu cuenta
        </Text>
        <Text className="mt-2 text-[15px] leading-6 text-[#65736b]">
          Usa los datos de tu usuario digital para ingresar de forma segura.
        </Text>
      </View>

      <AuthInput
        label="Número de documento"
        placeholder="Ingresa tu DNI"
        icon={<FileText color={FIELD_ICON_COLOR} size={20} />}
        keyboardType="number-pad"
        maxLength={8}
        value={form.documentNumber}
        editable={!loading}
        onChangeText={(value) => onChange("documentNumber", value.replace(/\D/g, ""))}
        textContentType="username"
      />
      <AuthInput
        label="Correo electrónico"
        placeholder="Tu correo o usuario digital"
        icon={<Mail color={FIELD_ICON_COLOR} size={20} />}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        value={form.email}
        editable={!loading}
        onChangeText={(value) => onChange("email", value)}
        textContentType="emailAddress"
      />
      <AuthInput
        label="Contraseña"
        placeholder="Ingresa tu contraseña"
        icon={<LockKeyhole color={FIELD_ICON_COLOR} size={20} />}
        secure
        value={form.password}
        editable={!loading}
        onChangeText={(value) => onChange("password", value)}
        textContentType="password"
        returnKeyType="done"
        onSubmitEditing={() => void handleLogin()}
      />

      <Pressable
        className="mb-6 self-end py-1"
        onPress={() =>
          show(
            "La recuperación de credenciales se implementará en el siguiente flujo.",
            "info",
          )
        }
      >
        <Text className="text-[14px] font-bold text-[#007c2e]">
          ¿Olvidaste tu contraseña o usuario?
        </Text>
      </Pressable>

      <AuthButton
        title={loading ? "Validando…" : "Ingresar"}
        disabled={loading || !isValid}
        onPress={() => void handleLogin()}
      />

      <View className="mt-8 flex-row items-center justify-center">
        <Text className="text-[14px] text-[#65736b]">¿Aún no tienes usuario? </Text>
        <Pressable
          onPress={() =>
            show("La creación de usuario se implementará en el siguiente flujo.", "info")
          }
        >
          <Text className="text-[14px] font-bold text-[#007c2e]">Créalo aquí</Text>
        </Pressable>
      </View>

      <Text className="mt-8 text-center text-[11px] leading-4 text-[#7d8a83]">
        Aplicación académica de banca simulada. No procesa dinero real.
      </Text>
      <ScreenLoader visible={loading} />
    </AuthScaffold>
  );
}
