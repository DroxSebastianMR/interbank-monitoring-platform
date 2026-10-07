import { ChevronDown } from "lucide-react-native";
import React, { useState } from "react";
import type { Ref } from "react";
import { TouchableOpacity, StyleSheet, Text, TextInput, View } from "react-native";

interface Props {
  value: string;
  error?: string;
  disabled: boolean;
  onChange: (value: string) => void;
  onBlur: () => void;
  onDocumentPress: () => void;
  onNext: () => void;
  inputRef?: Ref<TextInput>;
}

export function LoginDocumentField({
  value,
  error,
  disabled,
  onChange,
  onBlur,
  onDocumentPress,
  onNext,
  inputRef,
}: Props) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.field}>
      <Text style={styles.label}>Documento de identidad</Text>
      <View style={styles.row}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onDocumentPress}
          disabled={disabled}
          accessibilityRole="button"
          accessibilityLabel="Tipo de documento: DNI"
          accessibilityHint="Consulta el documento admitido"
          style={styles.type}
        >
          <Text style={styles.typeText}>DNI</Text>
          <ChevronDown color="#008D3B" size={17} />
        </TouchableOpacity>
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
              onBlur();
            }}
            keyboardType="number-pad"
            maxLength={8}
            autoCorrect={false}
            autoComplete="off"
            returnKeyType="next"
            onSubmitEditing={onNext}
            selectionColor="#008D3B"
            style={styles.textInput}
          />
        </View>
      </View>
      {error ? (
        <Text accessibilityLiveRegion="polite" style={styles.errorText}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: "600", color: "#34443B", marginBottom: 8 },
  row: { flexDirection: "row", gap: 10 },
  type: {
    width: 94,
    flexShrink: 0,
    minHeight: 58,
    paddingHorizontal: 17,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 14,
    borderWidth: 1,
    borderColor: "#DCE6DF",
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
  },
  typeText: { fontSize: 16, fontWeight: "600", color: "#173A27" },
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
  errorText: { marginTop: 6, fontSize: 12, color: "#B42318" },
});
