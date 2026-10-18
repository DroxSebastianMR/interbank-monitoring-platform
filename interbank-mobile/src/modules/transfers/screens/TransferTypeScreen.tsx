import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ChevronRight } from "lucide-react-native";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { AppStackParamList } from "@/src/application/navigation/AppNavigator";
import { TransferMode } from "@/src/domain/transfers/transfer.types";
import { BankingFlowScreen } from "@/src/shared/components/BankingFlowScreen";
import { TransferTypeIcon } from "@/src/modules/transfers/components/TransferTypeIcon";
import { useAccessibilityPreferences } from "@/src/shared/hooks/useAccessibilityPreferences";
import { BANKING_COLORS as C } from "@/src/shared/theme/banking.theme";

type Props = NativeStackScreenProps<AppStackParamList, "Transfers">;

export function TransferTypeScreen({ navigation }: Props) {
  const { reduceTransparency } = useAccessibilityPreferences();
  return (
    <BankingFlowScreen
      title="Transferencias"
      onBack={() => navigation.goBack()}
      opaque={reduceTransparency}
      headerTopSpacing={30}
      headerContentOffset={6}
    >
      <Text style={styles.heading}>Elige el tipo de transferencia</Text>
      <View style={styles.options}>
        {[
          {
            mode: TransferMode.OWN,
            title: "Entre mis cuentas",
          },
          {
            mode: TransferMode.OTHER,
            title: "A otras cuentas",
          },
        ].map(({ mode, title }) => (
          <TouchableOpacity
            key={mode}
            activeOpacity={0.75}
            accessibilityRole="button"
            onPress={() => navigation.navigate("TransferDestination", { mode })}
            style={styles.option}
          >
            <View style={styles.icon}>
              <TransferTypeIcon mode={mode} />
            </View>
            <View style={styles.copy}>
              <Text style={styles.optionTitle}>{title}</Text>
            </View>
            <ChevronRight size={20} color={C.greenDeep} />
          </TouchableOpacity>
        ))}
      </View>
    </BankingFlowScreen>
  );
}

const styles = StyleSheet.create({
  heading: {
    color: C.greenDeep,
    fontSize: 22,
    lineHeight: 29,
    fontWeight: "600",
    letterSpacing: -0.6,
    marginTop: 2,
  },
  options: { marginTop: 24 },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
    paddingVertical: 25,
    borderBottomWidth: 1,
    borderBottomColor: "#E7EDE9",
    minHeight: 105,
  },
  icon: {
    width: 58,
    height: 58,
    alignItems: "center",
    justifyContent: "center",
  },
  copy: { flex: 1 },
  optionTitle: {
    color: C.ink,
    fontSize: 17,
    fontWeight: "600",
    letterSpacing: -0.3,
  },
});
