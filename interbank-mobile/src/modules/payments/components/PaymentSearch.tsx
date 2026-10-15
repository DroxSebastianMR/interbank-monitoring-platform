import { Search, X } from "lucide-react-native";
import React from "react";
import { StyleSheet, TextInput, TouchableOpacity, View } from "react-native";

export function PaymentSearch({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <View style={styles.search}>
      <Search color="#849189" size={22} strokeWidth={1.7} />
      <TextInput
        accessibilityLabel="Buscar servicio a pagar"
        placeholder="Buscar servicio a pagar"
        placeholderTextColor="#849189"
        value={value}
        onChangeText={onChange}
        maxLength={80}
        autoCorrect={false}
        returnKeyType="search"
        style={styles.input}
      />
      {value ? (
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Limpiar búsqueda"
          onPress={() => onChange("")}
          style={styles.clear}
        >
          <X size={18} color="#607368" />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  search: {
    minHeight: 55,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    paddingLeft: 17,
    paddingRight: 6,
    backgroundColor: "#FFFFFF",
    borderRadius: 17,
  },
  input: {
    flex: 1,
    minWidth: 0,
    minHeight: 55,
    fontSize: 15,
    color: "#0B2A1A",
  },
  clear: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
});
