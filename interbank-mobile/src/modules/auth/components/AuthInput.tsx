import { Eye, EyeOff } from "lucide-react-native";
import React, { ReactNode, useState } from "react";
import type { Ref } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from "react-native";

type Props = Omit<TextInputProps, "secureTextEntry"> & {
  label: string;
  secure?: boolean;
  icon?: ReactNode;
  error?: string;
  variant?: "default" | "login";
  inputRef?: Ref<TextInput>;
};

export const AuthInput = ({
  label,
  secure = false,
  icon,
  error,
  editable = true,
  variant = "default",
  onFocus,
  onBlur,
  inputRef,
  ...rest
}: Props) => {
  const [hidden, setHidden] = useState(secure);
  const [focused, setFocused] = useState(false);
  const login = variant === "login";

  return (
    <View className="mb-4 w-full" style={login ? styles.field : undefined}>
      <Text className="mb-2 text-[13px] font-semibold text-[#34443b]">
        {label}
      </Text>
      <View
        style={
          login
            ? [styles.input, focused && styles.focused, error && styles.error]
            : undefined
        }
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
          ref={inputRef}
          {...rest}
          accessibilityLabel={rest.accessibilityLabel ?? label}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          secureTextEntry={hidden}
          placeholderTextColor="#829088"
          editable={editable}
          selectionColor="#009b3a"
          className="flex-1 py-3 text-[16px] text-[#14261c]"
        />
        {secure ? (
          <Pressable
            disabled={!editable}
            style={styles.visibilityButton}
            onPress={() => setHidden((current) => !current)}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={
              hidden ? "Mostrar contraseña" : "Ocultar contraseña"
            }
          >
            {hidden ? (
              <Eye color="#5f6f66" size={21} />
            ) : (
              <EyeOff color="#5f6f66" size={21} />
            )}
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <Text
          accessibilityLiveRegion="polite"
          className="mt-1.5 text-xs text-[#b42318]"
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  field: { marginBottom: 14 },
  input: {
    minHeight: 58,
    backgroundColor: "#FFFFFF",
    borderColor: "#DCE6DF",
    borderRadius: 16,
  },
  focused: {
    borderColor: "#008D3B",
    backgroundColor: "#FFFFFF",
    boxShadow: "0 0 0 3px rgba(0,168,68,0.08)",
  },
  error: { borderColor: "#D92D20" },
  visibilityButton: {
    minWidth: 44,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    marginRight: -10,
  },
});
