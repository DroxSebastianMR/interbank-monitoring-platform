import { Check, X } from "lucide-react-native";
import React from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type {
  TransferBeneficiary,
  TransferSource,
} from "@/src/domain/transfers/transfer.types";
import { BankingActionButton } from "@/src/shared/components/BankingActionButton";
import { BANKING_COLORS as C } from "@/src/shared/theme/banking.theme";

export function TransferDestinationSheet({
  visible,
  beneficiary,
  source,
  onClose,
  reduceMotion,
  opaque,
}: {
  visible: boolean;
  beneficiary: TransferBeneficiary | null;
  source?: TransferSource;
  onClose: () => void;
  reduceMotion: boolean;
  opaque: boolean;
}) {
  const insets = useSafeAreaInsets();
  return (
    <Modal
      visible={visible}
      transparent
      animationType={reduceMotion ? "none" : "fade"}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable
          accessibilityLabel="Cerrar datos del destino"
          accessibilityRole="button"
          onPress={onClose}
          style={StyleSheet.absoluteFill}
        />
        <View
          accessibilityViewIsModal
          style={[
            styles.sheet,
            { paddingBottom: Math.max(insets.bottom, 20) + 12 },
          ]}
        >
          <View style={styles.top}>
            <View style={styles.badge}>
              <Check size={22} color={C.greenDeep} />
            </View>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Cerrar"
              onPress={onClose}
              style={styles.close}
            >
              <X size={21} color="#6D8174" />
            </TouchableOpacity>
          </View>
          <Text accessibilityRole="header" style={styles.title}>
            {source ? "Cuentas seleccionadas" : "Cuenta encontrada"}
          </Text>
          {beneficiary ? (
            <>
              <Text style={styles.name}>{beneficiary.beneficiaryName}</Text>
              <View style={styles.details}>
                {source ? (
                  <>
                    <Text style={styles.label}>Cuenta de origen</Text>
                    <Text style={styles.value}>
                      {source.displayName} · {source.maskedAccountNumber}
                    </Text>
                  </>
                ) : null}
                <Text style={styles.label}>Cuenta de destino</Text>
                <Text style={styles.value}>{beneficiary.displayName}</Text>
                <Text selectable style={styles.number}>
                  {beneficiary.maskedAccountNumber}
                </Text>
                <Text style={styles.label}>Moneda</Text>
                <Text style={styles.value}>
                  {beneficiary.currency === "PEN" ? "Soles" : "Dólares"}
                </Text>
              </View>
            </>
          ) : null}
          <BankingActionButton
            title="Volver a los datos"
            opaque={opaque}
            onPress={onClose}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
    backgroundColor: "rgba(9,35,22,0.35)",
  },
  sheet: {
    backgroundColor: "#FFFFFF",
    width: "100%",
    maxWidth: 520,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
  },
  top: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  badge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#E7F8ED",
    alignItems: "center",
    justifyContent: "center",
  },
  close: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    color: C.ink,
    fontSize: 23,
    fontWeight: "600",
    marginTop: 18,
    letterSpacing: -0.5,
  },
  name: { color: C.greenDeep, fontSize: 17, fontWeight: "500", marginTop: 12 },
  details: { marginTop: 12, marginBottom: 25 },
  label: { color: "#849188", fontSize: 12, marginTop: 16 },
  value: { color: C.ink, fontSize: 14, lineHeight: 21, marginTop: 5 },
  number: { color: C.ink, fontSize: 17, marginTop: 7, letterSpacing: 1 },
});
