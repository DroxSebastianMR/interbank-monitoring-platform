import { Eye, EyeOff } from "lucide-react-native";
import React, { ReactNode, useState } from "react";
import { Pressable, Text, TextInput, TextInputProps, View } from "react-native";

type Props = Omit<TextInputProps, "secureTextEntry"> & {
  label: string;
  secure?: boolean;
  icon?: ReactNode;
  error?: string;
};

export const AuthInput = ({
  label,
  secure = false,
  icon,
  error,
  editable = true,
  ...rest
}: Props) => {
  const [hidden, setHidden] = useState(secure);

  return (
    <View className="mb-4 w-full">
      <Text className="mb-2 text-[13px] font-semibold text-[#34443b]">{label}</Text>
      <View
        className={`min-h-[56px] w-full flex-row items-center rounded-2xl border px-4 ${
          error
            ? "border-[#d92d20] bg-[#fff8f7]"
            : editable
              ? "border-[#ced8d2] bg-white"
              : "border-[#e2e7e4] bg-[#f3f5f4]"
        }`}
      >
        {icon ? <View className="mr-3">{icon}</View> : null}
        <TextInput
          {...rest}
          secureTextEntry={hidden}
          placeholderTextColor="#829088"
          editable={editable}
          selectionColor="#009b3a"
          className="flex-1 py-3 text-[16px] text-[#14261c]"
        />
        {secure ? (
          <Pressable
            onPress={() => setHidden((current) => !current)}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={hidden ? "Mostrar contraseña" : "Ocultar contraseña"}
          >
            {hidden ? (
              <Eye color="#5f6f66" size={21} />
            ) : (
              <EyeOff color="#5f6f66" size={21} />
            )}
          </Pressable>
        ) : null}
      </View>
      {error ? <Text className="mt-1.5 text-xs text-[#b42318]">{error}</Text> : null}
    </View>
  );
};
