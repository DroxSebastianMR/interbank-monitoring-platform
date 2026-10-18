import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Info } from "lucide-react-native";
import React from "react";
import {
  ActivityIndicator,
  Keyboard,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import type { AppStackParamList } from "@/src/application/navigation/AppNavigator";
import {
  TransferBank,
  TransferMode,
} from "@/src/domain/transfers/transfer.types";
import { TransferAccountPicker } from "@/src/modules/transfers/components/TransferAccountPicker";
import { TransferDestinationSheet } from "@/src/modules/transfers/components/TransferDestinationSheet";
import { useTransferDestination } from "@/src/modules/transfers/hooks/useTransferDestination";
import { BankingFlowScreen } from "@/src/shared/components/BankingFlowScreen";
import { BankingActionButton } from "@/src/shared/components/BankingActionButton";
import { useAccessibilityPreferences } from "@/src/shared/hooks/useAccessibilityPreferences";
import { BANKING_COLORS as C } from "@/src/shared/theme/banking.theme";

type Props = NativeStackScreenProps<AppStackParamList, "TransferDestination">;

export function TransferDestinationScreen({ route, navigation }: Props) {
  const own = route.params.mode === TransferMode.OWN;
  const flow = useTransferDestination(route.params.mode);
  const { reduceTransparency, reduceMotion } = useAccessibilityPreferences();
  const next = () => {
    Keyboard.dismiss();
    void flow.next();
  };
  return (
    <BankingFlowScreen
      title="Transferencias"
      variant="light"
      onBack={() => navigation.goBack()}
      footer={
        <BankingActionButton
          title="Siguiente"
          disabled={!flow.valid || flow.loadingAccounts}
          loading={flow.busy}
          opaque={reduceTransparency}
          onPress={next}
        />
      }
    >
      {own ? (
        <>
          <Text style={styles.heading}>Entre mis cuentas</Text>
          <Text style={styles.hint}>
            Elige las cuentas de origen y destino.
          </Text>
          {flow.loadingAccounts ? (
            <View style={styles.loading}>
              <ActivityIndicator
                color={C.green}
                accessibilityLabel="Cargando tus cuentas"
              />
            </View>
          ) : (
            <>
              {!flow.accounts.length && !flow.error ? (
                <Text style={styles.empty}>
                  No tienes cuentas habilitadas para transferir.
                </Text>
              ) : null}
              {flow.accounts.length ? (
                <TransferAccountPicker
                  label="De esta cuenta"
                  accounts={flow.accounts}
                  selected={flow.sourceId}
                  onSelect={flow.changeSource}
                />
              ) : null}
              {flow.destinations.length ? (
                <TransferAccountPicker
                  label="A esta cuenta"
                  accounts={flow.destinations}
                  selected={flow.destinationId}
                  onSelect={flow.setDestinationId}
                />
              ) : flow.source ? (
                <Text style={styles.empty}>
                  Necesitas otra cuenta habilitada en la misma moneda.
                </Text>
              ) : null}
            </>
          )}
        </>
      ) : (
        <>
          <View style={styles.tabs} accessibilityRole="tablist">
            {[
              { bank: TransferBank.INTERBANK, label: "Interbank" },
              { bank: TransferBank.DOMESTIC, label: "Otro banco" },
              { bank: TransferBank.INTERNATIONAL, label: "Al exterior" },
            ].map((item) => (
              <TouchableOpacity
                key={item.bank}
                accessibilityRole="tab"
                accessibilityState={{ selected: flow.bank === item.bank }}
                activeOpacity={0.85}
                onPress={() => flow.changeBank(item.bank)}
                style={[
                  styles.tab,
                  flow.bank === item.bank && styles.selectedTab,
                ]}
              >
                <Text
                  style={[
                    styles.tabText,
                    flow.bank === item.bank && styles.selectedTabText,
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {flow.bank === TransferBank.INTERBANK ? (
            <View style={styles.numberSection}>
              <Text style={styles.label}>Número de cuenta de destino</Text>
              <TextInput
                accessibilityLabel="Número de cuenta de destino"
                value={flow.number}
                onChangeText={flow.changeNumber}
                placeholder="000 0000000000"
                placeholderTextColor="#ABB5AF"
                keyboardType="number-pad"
                autoCorrect={false}
                autoCapitalize="none"
                autoComplete="off"
                maxLength={30}
                returnKeyType="done"
                onSubmitEditing={next}
                style={styles.input}
              />
              <Text style={styles.hint}>
                Ingresa el número de la cuenta Interbank.
              </Text>
            </View>
          ) : (
            <View style={styles.unavailable}>
              <View style={styles.infoIcon}>
                <Info size={24} color={C.greenDeep} />
              </View>
              <Text style={styles.heading}>
                {flow.bank === TransferBank.DOMESTIC
                  ? "A otro banco"
                  : "Al exterior"}
              </Text>
              <Text style={styles.hint}>
                {flow.bank === TransferBank.DOMESTIC
                  ? "Las transferencias con CCI estarán disponibles próximamente."
                  : "Las transferencias internacionales estarán disponibles próximamente."}
              </Text>
              <Text style={styles.hint}>
                Por ahora puedes consultar cuentas Interbank.
              </Text>
            </View>
          )}
        </>
      )}
      {flow.error ? (
        <View style={styles.errorBox}>
          <Text accessibilityLiveRegion="polite" style={styles.error}>
            {flow.error}
          </Text>
          {own ? (
            <TouchableOpacity
              accessibilityRole="button"
              onPress={flow.reload}
              style={styles.retry}
            >
              <Text style={styles.retryText}>Volver a intentar</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : null}
      <TransferDestinationSheet
        visible={flow.sheetVisible}
        beneficiary={flow.verified}
        source={own ? flow.source : undefined}
        onClose={flow.closeSheet}
        reduceMotion={reduceMotion}
        opaque={reduceTransparency}
      />
    </BankingFlowScreen>
  );
}

const styles = StyleSheet.create({
  heading: {
    color: C.ink,
    fontSize: 22,
    lineHeight: 29,
    fontWeight: "600",
    letterSpacing: -0.5,
  },
  hint: { fontSize: 12, lineHeight: 19, color: "#819087", marginTop: 9 },
  tabs: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#DEE8E1",
    borderRadius: 15,
    overflow: "hidden",
    backgroundColor: "#F6F9F7",
    padding: 3,
    gap: 3,
  },
  tab: {
    flex: 1,
    minHeight: 45,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    paddingHorizontal: 3,
    paddingVertical: 10,
  },
  selectedTab: { backgroundColor: C.green },
  tabText: {
    fontSize: 12,
    color: "#839088",
    fontWeight: "500",
    textAlign: "center",
  },
  selectedTabText: { color: "#FFFFFF", fontWeight: "600" },
  numberSection: { marginTop: 32 },
  label: { color: C.ink, fontSize: 17, fontWeight: "500", lineHeight: 24 },
  input: {
    color: C.ink,
    fontSize: 25,
    minHeight: 68,
    paddingVertical: 17,
    borderBottomWidth: 1,
    borderBottomColor: "#C7D9CD",
    letterSpacing: 0.7,
    marginTop: 10,
  },
  unavailable: { marginTop: 42 },
  infoIcon: {
    width: 48,
    height: 48,
    backgroundColor: "#EAF7EF",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  empty: { color: "#819087", fontSize: 13, lineHeight: 21, marginTop: 24 },
  loading: { paddingVertical: 40 },
  errorBox: {
    backgroundColor: "#FFF5F1",
    padding: 15,
    borderRadius: 12,
    marginTop: 24,
  },
  error: { color: "#974E3D", fontSize: 13, lineHeight: 20 },
  retry: { minHeight: 44, justifyContent: "center", alignSelf: "flex-start" },
  retryText: { color: C.greenDeep, fontSize: 13, fontWeight: "600" },
});
