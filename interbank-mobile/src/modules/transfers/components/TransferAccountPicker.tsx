import { Check, Circle, WalletCards } from "lucide-react-native";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { TransferSource } from "@/src/domain/transfers/transfer.types";
import { BANKING_COLORS as C } from "@/src/shared/theme/banking.theme";

export function TransferAccountPicker({
  label,
  accounts,
  selected,
  onSelect,
}: {
  label: string;
  accounts: TransferSource[];
  selected: string;
  onSelect: (id: string) => void;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.label}>{label}</Text>
      {accounts.map((item) => (
        <TouchableOpacity
          key={item.id}
          activeOpacity={0.8}
          accessibilityRole="radio"
          accessibilityState={{ checked: selected === item.id }}
          onPress={() => onSelect(item.id)}
          style={[styles.row, selected === item.id && styles.selected]}
        >
          <WalletCards size={22} color={C.greenDeep} />
          <View style={styles.copy}>
            <Text style={styles.name}>{item.displayName}</Text>
            <Text style={styles.number}>
              {item.maskedAccountNumber} ·{" "}
              {item.currency === "PEN" ? "Soles" : "Dólares"}
            </Text>
            <Text style={styles.balance}>
              Disponible{" "}
              {new Intl.NumberFormat("es-PE", {
                style: "currency",
                currency: item.currency,
              }).format(Number(item.availableBalance))}
            </Text>
          </View>
          {selected === item.id ? (
            <Check size={19} color={C.blueAction} />
          ) : (
            <Circle size={18} color="#A3B1A8" />
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: 25 },
  label: { color: C.ink, fontSize: 15, fontWeight: "600", marginBottom: 13 },
  row: {
    borderWidth: 1,
    borderColor: "#E5ECE7",
    borderRadius: 15,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 10,
  },
  selected: { borderColor: C.blueAction, backgroundColor: "#F5F8FF" },
  copy: { flex: 1 },
  name: { fontSize: 14, color: C.ink, fontWeight: "500" },
  number: { color: "#819087", fontSize: 12, lineHeight: 18, marginTop: 5 },
  balance: {
    color: C.greenDeep,
    fontSize: 12,
    fontWeight: "500",
    marginTop: 7,
  },
});
