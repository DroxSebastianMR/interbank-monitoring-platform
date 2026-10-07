import { LockKeyhole } from "lucide-react-native";
import React from "react";
import { Text, View } from "react-native";

import { AuthButton } from "@/src/modules/auth/components/AuthButton";
import { AuthInput } from "@/src/modules/auth/components/AuthInput";
import { AuthScaffold } from "@/src/modules/auth/components/AuthScaffold";
import { QuickAccessActions } from "@/src/modules/auth/components/QuickAccessActions";
import { useDeviceLogin } from "@/src/modules/auth/hooks/useDeviceLogin";
import { ScreenLoader } from "@/src/modules/system/ui/components/ScreenLoader";
import { useToast } from "@/src/modules/system/ui/hooks/useToast";

function displayName(firstName?: string): string {
  return firstName?.trim() || "cliente";
}

export function DeviceLoginScreen() {
  const {
    user,
    password,
    loading,
    isValid,
    setPassword,
    handleDeviceLogin,
    handleUseAnotherAccount,
  } = useDeviceLogin();
  const { show } = useToast();

  return (
    <AuthScaffold>
      <View className="mb-7">
        <Text className="text-[30px] font-black tracking-[-0.7px] text-[#14261c]">
          Hola, {displayName(user?.firstName)}
        </Text>
        <Text className="mt-2 text-[15px] leading-6 text-[#65736b]">
          Ingresa tu contraseña para continuar.
        </Text>
        {user?.documentNumber ? (
          <View className="mt-4 self-start rounded-full bg-[#e3f4e9] px-4 py-2">
            <Text className="text-[13px] font-semibold text-[#087733]">
              DNI {user.documentNumber}
            </Text>
          </View>
        ) : null}
      </View>

      <AuthInput
        label="Contraseña"
        placeholder="Ingresa tu contraseña"
        icon={<LockKeyhole color="#66756d" size={20} />}
        secure
        value={password}
        editable={!loading}
        onChangeText={setPassword}
        textContentType="password"
        returnKeyType="done"
        onSubmitEditing={() => void handleDeviceLogin()}
      />

      <View className="mt-2 gap-3">
        <AuthButton
          title={loading ? "Validando…" : "Ingresar"}
          disabled={loading || !isValid}
          onPress={() => void handleDeviceLogin()}
        />
        <AuthButton
          title="Ingresar con otra cuenta"
          variant="secondary"
          disabled={loading}
          onPress={() => void handleUseAnotherAccount()}
        />
      </View>

      <QuickAccessActions
        onPress={() =>
          show("Este acceso rápido se conectará en su módulo correspondiente.", "info")
        }
      />

      <Text className="mt-7 text-center text-[11px] leading-4 text-[#7d8a83]">
        Tu sesión está vinculada de forma segura a este dispositivo.
      </Text>
      <ScreenLoader visible={loading} />
    </AuthScaffold>
  );
}
