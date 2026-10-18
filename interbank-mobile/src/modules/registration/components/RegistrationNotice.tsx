import { Info } from "lucide-react-native";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { BANKING_COLORS as C } from "@/src/shared/theme/banking.theme";

export function RegistrationNotice({
  title = "Vista previa",
  description,
}: {
  title?: string;
  description: string;
}) {
  return (
    <View style={styles.notice}>
      <Info size={17} color={C.greenDeep} />
      <View style={styles.copy}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  notice: {
    flexDirection: "row",
    gap: 10,
    backgroundColor: "#F2F8F4",
    padding: 15,
    borderRadius: 14,
    marginTop: 22,
  },
  copy: { flex: 1 },
  title: { color: C.greenDeep, fontSize: 12, fontWeight: "600" },
  description: { color: "#738579", fontSize: 12, lineHeight: 19, marginTop: 5 },
});
