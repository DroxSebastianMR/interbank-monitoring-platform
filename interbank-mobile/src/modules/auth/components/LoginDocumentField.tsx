import React, { useState } from "react";
import type { Ref } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";

import { LoginDocumentTypeSelector } from "@/src/modules/auth/components/LoginDocumentTypeSelector";

interface Props {
  value: string;
  error?: string;
  disabled: boolean;
  reduceTransparency?: boolean;
  onChange: (value: string) => void;
  inputRef?: Ref<TextInput>;
}

export function LoginDocumentField({
  value,
  error,
  disabled,
  reduceTransparency,
  onChange,
  inputRef,
}: Props) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.field}>
      <Text style={styles.label}>Documento de identidad</Text>
      <View style={styles.row}>
        <LoginDocumentTypeSelector
          disabled={disabled}
          reduceTransparency={reduceTransparency}
        />
        <View
          style={[
            styles.number,
            focused && styles.focused,
            !!error && styles.error,
          ]}
        >
          <TextInput
            ref={inputRef}
            accessibilityLabel="Número de DNI"
            placeholder="N° de documento"
            placeholderTextColor="#7A8981"
            value={value}
            onChangeText={(text) => onChange(text.replace(/\D/g, ""))}
            editable={!disabled}
            onFocus={() => setFocused(true)}
            onBlur={() => {
              setFocused(false);
            }}
            keyboardType="number-pad"
            keyboardAppearance="light"
            maxLength={8}
            autoCorrect={false}
            autoComplete="off"
            selectionColor="#008D3B"
            style={styles.textInput}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  field: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: "600", color: "#34443B", marginBottom: 8 },
  row: { flexDirection: "row", gap: 10 },
  number: {
    flex: 1,
    minWidth: 0,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#DCE6DF",
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
  },
  textInput: {
    width: "100%",
    fontSize: 16,
    color: "#14261C",
    paddingVertical: 16,
    paddingHorizontal: 14,
  },
  focused: {
    borderColor: "#008D3B",
    boxShadow: "0 0 0 3px rgba(0,168,68,0.08)",
  },
  error: { borderColor: "#D92D20" },
});
