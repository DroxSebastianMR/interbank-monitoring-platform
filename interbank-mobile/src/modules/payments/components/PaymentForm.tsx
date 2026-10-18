import { Check, Circle, Wallet } from "lucide-react-native";
import React from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { PaymentStep } from "@/src/domain/payments/payment.types";
import type { useServicePayments } from "@/src/modules/payments/hooks/useServicePayments";
import {
  formatPaymentDate,
  formatPaymentMoney as money,
} from "@/src/modules/payments/utils/payment-format";
import { DetailRow, PaymentAction, PaymentNotice } from "./PaymentPrimitives";
import { SaveFrequentService } from "./SaveFrequentService";
import { BANKING_COLORS as C } from "@/src/shared/theme/banking.theme";

export function PaymentForm({
  flow,
  opaque,
}: {
  flow: ReturnType<typeof useServicePayments>;
  opaque: boolean;
}) {
  const { service, provider, receipt } = flow;
  if (flow.step === PaymentStep.RECEIPT && receipt) {
    const completed = receipt.status === "COMPLETED";
    return (
      <>
        <View style={styles.success}>
          <View style={styles.successIcon}>
            {completed ? (
              <Check size={32} color={C.greenDeep} />
            ) : (
              <Circle size={32} color={C.greenDeep} />
            )}
          </View>
          <Text style={styles.title}>
            {completed ? "Pago realizado" : "Estado de tu pago"}
          </Text>
          <Text style={styles.muted}>
            {completed ? receipt.provider.name : `Estado: ${receipt.status}`}
          </Text>
          <Text selectable style={styles.receiptAmount}>
            {money(receipt.totalAmount, receipt.currency)}
          </Text>
        </View>
        <View style={styles.card}>
          <DetailRow label="Empresa" value={receipt.provider.name} />
          <DetailRow label="Servicio" value={receipt.service.name} />
          <DetailRow
            label="Código de cliente"
            value={receipt.customerReference}
          />
          <DetailRow
            label="Cuenta de cargo"
            value={`${receipt.account.displayName} ${receipt.account.maskedNumber}`}
          />
          <DetailRow
            label="Importe"
            value={money(receipt.amount, receipt.currency)}
          />
          <DetailRow
            label="Comisión"
            value={money(receipt.commissionAmount, receipt.currency)}
          />
          <DetailRow label="N.º de operación" value={receipt.operationNumber} />
          {receipt.paidAt ? (
            <DetailRow
              label="Fecha"
              value={formatPaymentDate(receipt.paidAt)}
            />
          ) : null}
        </View>
        {completed ? (
          <SaveFrequentService key={receipt.id} receipt={receipt} />
        ) : null}
        <PaymentAction
          title="Pagar otro servicio"
          opaque={opaque}
          onPress={flow.reset}
        />
      </>
    );
  }
  if (!service || !provider)
    return (
      <PaymentNotice
        title="Esta empresa no tiene servicios disponibles"
        action="Volver a las empresas"
        onPress={flow.back}
      />
    );

  if (flow.step === PaymentStep.REVIEW)
    return (
      <>
        <Text style={styles.title}>Confirma tu pago</Text>
        <View style={styles.paymentTotal}>
          <Text style={styles.totalLabel}>Total a pagar</Text>
          <Text style={styles.totalValue}>
            {money(flow.totalAmount, service.currency)}
          </Text>
          <Text style={styles.totalProvider}>
            {provider.shortName || provider.name}
          </Text>
        </View>
        <View style={styles.card}>
          <DetailRow label="Empresa" value={provider.name} />
          <DetailRow label="Servicio" value={service.name} />
          <DetailRow
            label={service.referenceLabel}
            value={flow.reference.trim()}
          />
          {flow.debt ? (
            <DetailRow label="Recibo" value={flow.debt.invoiceNumber} />
          ) : null}
          <DetailRow
            label="Importe"
            value={money(flow.paymentAmount, service.currency)}
          />
          <DetailRow
            label="Comisión"
            value={money(service.commissionAmount, service.currency)}
          />
        </View>
        <Text style={styles.label}>Cuenta de cargo</Text>
        {!flow.accounts.length ? (
          <PaymentNotice
            title="Necesitas una cuenta compatible"
            description={`No tienes cuentas disponibles en ${service.currency === "PEN" ? "soles" : "dólares"} para este servicio.`}
          />
        ) : (
          flow.accounts.map((account) => (
            <TouchableOpacity
              key={account.id}
              activeOpacity={0.8}
              accessibilityRole="radio"
              accessibilityState={{
                checked: flow.accountId === account.id,
                disabled: flow.busy || flow.uncertain,
              }}
              disabled={flow.busy || flow.uncertain}
              onPress={() => flow.setAccountId(account.id)}
              style={[
                styles.option,
                flow.accountId === account.id && styles.selected,
              ]}
            >
              <Wallet size={21} color={C.greenDeep} />
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>{account.displayName}</Text>
                <Text style={styles.muted}>{account.maskedAccountNumber}</Text>
                <Text style={styles.balance}>
                  Disponible {money(account.availableBalance, account.currency)}
                </Text>
              </View>
              {flow.accountId === account.id ? (
                <Check size={20} color={C.greenDeep} />
              ) : (
                <Circle size={18} color="#A7B8AE" />
              )}
            </TouchableOpacity>
          ))
        )}
        {flow.accounts.length > 0 && !flow.enoughBalance ? (
          <PaymentNotice
            title="Saldo insuficiente"
            description="El saldo debe cubrir el importe y la comisión del servicio."
          />
        ) : null}
        {flow.error ? (
          <PaymentNotice
            title="No pudimos confirmar el pago"
            description={flow.error}
          />
        ) : null}
        {flow.uncertain ? (
          <PaymentNotice
            title="Confirma el resultado antes de salir"
            description="Reintenta esta misma operación para consultar su resultado sin duplicar el cargo. No inicies otro pago para este recibo."
          />
        ) : null}
        <PaymentAction
          title={
            flow.uncertain
              ? "Reintentar la misma operación"
              : `Pagar ${money(flow.totalAmount, service.currency)}`
          }
          busy={flow.busy}
          disabled={!flow.enoughBalance || !flow.accountId}
          opaque={opaque}
          onPress={() => void flow.pay()}
        />
        <Text style={styles.footnote}>
          Al confirmar se cargará el total a la cuenta seleccionada.
        </Text>
      </>
    );

  return (
    <>
      <Text style={styles.title}>{provider.shortName || provider.name}</Text>
      <Text style={styles.muted}>
        Ingresa los datos tal como aparecen en tu recibo.
      </Text>
      <Text style={styles.label}>Selecciona el servicio</Text>
      {provider.agreements.map((item) => (
        <TouchableOpacity
          key={item.code}
          accessibilityRole="radio"
          accessibilityState={{
            checked: item.code === service.code,
            disabled: flow.busy,
          }}
          disabled={flow.busy}
          onPress={() => flow.changeService(item)}
          style={[
            styles.serviceOption,
            item.code === service.code && styles.selected,
          ]}
        >
          <Text style={styles.serviceName}>{item.name}</Text>
          {item.code === service.code ? (
            <Check size={19} color={C.greenDeep} />
          ) : (
            <Circle size={18} color="#A7B8AE" />
          )}
        </TouchableOpacity>
      ))}
      <Text style={styles.label}>{service.referenceLabel}</Text>
      <TextInput
        accessibilityLabel={service.referenceLabel}
        placeholder={`Ingresa tu ${service.referenceLabel.toLowerCase()}`}
        placeholderTextColor="#7A8B81"
        value={flow.reference}
        onChangeText={flow.changeReference}
        editable={!flow.busy}
        maxLength={service.referenceMaxLength}
        autoCorrect={false}
        autoCapitalize="none"
        style={styles.input}
        returnKeyType="done"
      />
      <Text style={styles.inputHint}>
        Lo encontrarás en tu recibo o contrato.
      </Text>
      {service.supportsDebtInquiry ? (
        <>
          <PaymentAction
            title="Consultar recibos"
            busy={flow.busy}
            disabled={!flow.reference.trim()}
            opaque={opaque}
            onPress={() => void flow.inquire()}
          />
          {flow.debts !== null ? (
            <>
              <Text style={styles.label}>Recibos pendientes</Text>
              {!flow.debts.length ? (
                <PaymentNotice
                  title="No tienes recibos pendientes"
                  description="Revisa el código ingresado si esperabas encontrar un recibo."
                />
              ) : (
                flow.debts.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    activeOpacity={0.8}
                    accessibilityRole="radio"
                    accessibilityState={{
                      checked: flow.debt?.id === item.id,
                      disabled: flow.busy,
                    }}
                    disabled={flow.busy}
                    onPress={() => flow.setDebt(item)}
                    style={[
                      styles.option,
                      flow.debt?.id === item.id && styles.selected,
                    ]}
                  >
                    <View style={styles.optionContent}>
                      <Text style={styles.optionTitle}>{item.description}</Text>
                      <Text style={styles.muted}>
                        Recibo {item.invoiceNumber}
                      </Text>
                      <Text style={styles.muted}>
                        Vence {formatPaymentDate(item.dueDate)}
                      </Text>
                      <Text style={styles.debtAmount}>
                        {money(item.amount, item.currency)}
                      </Text>
                    </View>
                    {flow.debt?.id === item.id ? (
                      <Check size={20} color={C.greenDeep} />
                    ) : (
                      <Circle size={18} color="#A7B8AE" />
                    )}
                  </TouchableOpacity>
                ))
              )}
            </>
          ) : null}
        </>
      ) : (
        <>
          <Text style={styles.label}>
            Monto a pagar ({service.currency === "PEN" ? "S/" : "US$"})
          </Text>
          <TextInput
            accessibilityLabel="Monto a pagar"
            value={flow.amount}
            onChangeText={flow.setAmount}
            editable={!flow.busy}
            placeholder="0.00"
            placeholderTextColor="#7A8B81"
            keyboardType="decimal-pad"
            maxLength={15}
            style={styles.input}
          />
          <Text style={styles.inputHint}>
            {service.minimumAmount
              ? `Mínimo ${money(service.minimumAmount, service.currency)}. `
              : ""}
            {service.maximumAmount
              ? `Máximo ${money(service.maximumAmount, service.currency)}.`
              : ""}
          </Text>
        </>
      )}
      {flow.error ? (
        <PaymentNotice title="Revisa los datos" description={flow.error} />
      ) : null}
      {!service.supportsDebtInquiry || flow.debt ? (
        <PaymentAction
          title="Continuar"
          busy={flow.busy}
          disabled={
            !flow.reference.trim() ||
            (!service.supportsDebtInquiry && !flow.amount.trim())
          }
          opaque={opaque}
          onPress={() => void flow.review()}
        />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  title: { color: C.ink, fontSize: 23, fontWeight: "600", letterSpacing: -0.6 },
  muted: { color: "#607368", fontSize: 13, lineHeight: 21, marginTop: 5 },
  label: {
    color: C.ink,
    fontSize: 14,
    fontWeight: "600",
    marginTop: 24,
    marginBottom: 12,
  },
  input: {
    borderRadius: 12,
    minHeight: 56,
    borderWidth: 1,
    borderColor: C.surfaceBorder,
    padding: 16,
    color: C.ink,
    backgroundColor: "#F7F9F8",
    fontSize: 15,
  },
  inputHint: { color: "#657C6D", fontSize: 12, lineHeight: 19, marginTop: 8 },
  serviceOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.surfaceBorder,
    padding: 16,
    marginBottom: 8,
    backgroundColor: "#FFFFFF",
    minHeight: 54,
  },
  serviceName: { flex: 1, color: C.ink, fontSize: 14 },
  selected: { borderColor: C.blueAction, backgroundColor: "#F3F7FF" },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: C.surfaceBorder,
    borderRadius: 13,
    marginBottom: 10,
    backgroundColor: "#FFFFFF",
  },
  optionContent: { flex: 1 },
  optionTitle: { fontWeight: "600", fontSize: 14, color: C.ink },
  balance: {
    fontSize: 13,
    fontWeight: "600",
    color: C.greenDeep,
    marginTop: 9,
  },
  debtAmount: { fontSize: 21, color: C.ink, fontWeight: "700", marginTop: 10 },
  card: {
    borderTopWidth: 1,
    borderTopColor: "#E2EAE5",
    paddingTop: 5,
    marginTop: 22,
  },
  paymentTotal: { alignItems: "center", paddingTop: 30, paddingBottom: 8 },
  totalLabel: { color: "#7A8A80", fontSize: 13 },
  totalValue: {
    color: C.ink,
    fontSize: 38,
    fontWeight: "600",
    letterSpacing: -1.6,
    marginTop: 9,
    textAlign: "center",
  },
  totalProvider: {
    fontSize: 14,
    color: C.greenDeep,
    marginTop: 10,
    textAlign: "center",
  },
  success: { alignItems: "center", gap: 10, paddingTop: 6 },
  successIcon: {
    height: 70,
    width: 70,
    borderRadius: 35,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#DFF7E7",
    marginBottom: 8,
  },
  receiptAmount: {
    fontSize: 36,
    fontWeight: "700",
    color: C.greenDeep,
    marginTop: 12,
    textAlign: "center",
  },
  footnote: {
    fontSize: 12,
    color: "#607368",
    lineHeight: 19,
    textAlign: "center",
    marginTop: 12,
  },
});
